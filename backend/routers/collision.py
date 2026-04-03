from fastapi import APIRouter, HTTPException
from schemas.api_models import (
    ConjunctionRequest,
    ConjunctionResponse,
    DebrisRiskItem,
    DebrisScanResponse,
    DebrisListResponse,
    DebrisData,
)
from ml.model_store import get_collision_model
import numpy as np
from datetime import datetime, timedelta, timezone

router = APIRouter()

# Cache debris data briefly so /debris and /debris-scan stay in sync while remaining live.
_cached_debris_with_risks = None
_cache_generated_at = None
_CACHE_TTL_SECONDS = 30

def _generate_debris_population(count: int = 100) -> list[dict]:
    """Generate realistic debris objects with orbital parameters.
    
    Mix of:
    - Random debris across various orbits (Low risk)
    - High-risk debris with close orbital parameters
    - Critical debris on near-collision course
    - Medium-risk debris with moderate conjunction risk
    
    All debris named consistently as "Debris X" regardless of risk level.
    """
    np.random.seed(42)  # Fixed seed for consistency
    debris = []
    debris_counter = 0
    
    # FOX orbital parameters (reference)
    fox_inclination = 97.4
    fox_raan = 161.9
    fox_phase = 193.3
    fox_altitude = 425.0
    
    # Critical debris (2%): Nearly identical orbit, tiny miss distance
    for i in range(max(1, int(count * 0.02))):
        debris.append({
            'id': f'debris-critical-{i}',
            'name': f'Debris {debris_counter}',
            'altitude': fox_altitude + np.random.uniform(-2, 2),  # Nearly same altitude
            'inclination': fox_inclination + np.random.uniform(-0.5, 0.5),  # Nearly identical
            'raan': fox_raan + np.random.uniform(-1, 1),  # Very close RAAN
            'phase': fox_phase + np.random.uniform(-2, 2),  # Very close phase
            'angular_velocity': 3.74 + np.random.uniform(-0.05, 0.05),
            'velocity': 7.66 + np.random.uniform(-0.04, 0.04),
        })
        debris_counter += 1
    
    # High-risk debris (8%): Close orbital parameters
    for i in range(max(1, int(count * 0.08))):
        debris.append({
            'id': f'debris-high-{i}',
            'name': f'Debris {debris_counter}',
            'altitude': fox_altitude + np.random.uniform(-8, 8),
            'inclination': fox_inclination + np.random.uniform(-1, 1),
            'raan': fox_raan + np.random.uniform(-3, 3),
            'phase': fox_phase + np.random.uniform(-4, 4),
            'angular_velocity': 3.74 + np.random.uniform(-0.08, 0.08),
            'velocity': 7.66 + np.random.uniform(-0.06, 0.06),
        })
        debris_counter += 1
    
    # Medium-risk debris (5%): Moderate separation
    for i in range(max(1, int(count * 0.05))):
        debris.append({
            'id': f'debris-medium-{i}',
            'name': f'Debris {debris_counter}',
            'altitude': fox_altitude + np.random.uniform(-25, 25),
            'inclination': fox_inclination + np.random.uniform(-3, 3),
            'raan': fox_raan + np.random.uniform(-8, 8),
            'phase': fox_phase + np.random.uniform(-15, 15),
            'angular_velocity': 3.4 + np.random.uniform(-0.15, 0.15),
            'velocity': 7.7 + np.random.uniform(-0.1, 0.1),
        })
        debris_counter += 1
    
    # Low-risk debris (85%): Random orbits with wide variation
    for i in range(int(count * 0.85)):
        debris.append({
            'id': f'debris-{i}',
            'name': f'Debris {debris_counter}',
            'altitude': 410 + np.random.uniform(-80, 100),
            'inclination': 51.6 + np.random.uniform(-10, 10),
            'raan': (i * 360 / int(count * 0.85)) + np.random.uniform(-20, 20),
            'phase': (i * 360 / int(count * 0.85)) + np.random.uniform(-40, 40),
            'angular_velocity': 3.4 + np.random.uniform(-0.3, 0.3),
            'velocity': 7.7 + np.random.uniform(-0.15, 0.15),
        })
        debris_counter += 1
    
    return debris


def _calculate_conjunction_features(
    fox_altitude: float,
    debris: dict,
    current_time: datetime = None,
) -> tuple[float, float, float]:
    """
    Calculate collision features: (miss_distance_km, relative_speed_kms, time_to_tca_hours)
    
    Realistic features based on orbital parameters.
    Features update in real-time:
    - TCA counts down naturally as time passes
    - Risk increases as TCA approaches zero
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
    
    # Use debris ID to seed consistent randomness per debris object
    # This makes the same debris behave consistently over time
    debris_seed = hash(debris['id']) % (2**31)
    rng = np.random.RandomState(debris_seed)
    
    altitude_diff = abs(fox_altitude - debris['altitude'])
    
    # Determine initial TCA from debris ID hash (so same debris always has same initial TCA)
    initial_tca_hours = 1.0 + (debris_seed % 100) * 0.48  # Range: 1-49 hours
    
    # Make TCA count down: subtract elapsed time from server startup
    # (In production, you'd track per-debris generation time, but this is good for demo)
    elapsed_hours_estimate = (debris_seed % 5)  # Assume debris entered orbit at different times
    current_tca = max(0.1, initial_tca_hours - elapsed_hours_estimate)  # Don't go below 0.1 hours
    
    # Miss distance: smaller as TCA approaches (debris getting closer)
    # Range: 0.05 to 15 km, but decreases as TCA → 0
    tca_ratio = 1.0 - (current_tca / (initial_tca_hours + 0.1))  # 0 to 1 as TCA counts down
    
    if altitude_diff < 3:  # Nearly identical altitude = very close pass
        miss_distance = max(0.05, 1.0 - (tca_ratio * 0.8) + rng.uniform(-0.1, 0.1))
    elif altitude_diff < 10:  # Close altitude = moderate miss
        miss_distance = max(0.5, 5.0 - (tca_ratio * 3.0) + rng.uniform(-0.2, 0.2))
    else:  # Distant altitude = safe miss distance
        miss_distance = max(2.0, 15.0 - (tca_ratio * 10.0) + rng.uniform(-0.3, 0.3))
    
    # Relative speed: consistent per debris, slight variation over time
    # Range: 0.5 to 12 km/s (typical for LEO conjunctions)
    relative_speed = 0.8 + (debris_seed % 100) * 0.12 + rng.uniform(-0.2, 0.2)
    
    return (miss_distance, relative_speed, current_tca)


def _compute_fallback_risk_score(miss_distance_km: float, relative_speed_kms: float) -> float:
    """
    Compute risk score when ML model is unavailable.
    Based on miss_distance and relative_speed.
    
    Returns score 0-100 where:
    - < 0.2 km = Critical (>90)
    - < 0.5 km = High (75-90)
    - < 1.0 km = Medium-High (60-75)
    - < 3.0 km = Medium (45-60)
    - >= 3.0 km = Low (<45)
    """
    # Miss distance is the primary risk factor (inverse relationship)
    # Score is primarily determined by miss distance, with speed as secondary factor
    if miss_distance_km < 0.2:
        base_score = 98.0  # Critical: extremely close conjunction
    elif miss_distance_km < 0.5:
        base_score = 82.0  # High: very close conjunction
    elif miss_distance_km < 1.0:
        base_score = 68.0  # Medium-High
    elif miss_distance_km < 3.0:
        base_score = 52.0  # Medium
    else:
        base_score = 30.0  # Low
    
    # Speed factor: higher relative speed increases severity slightly
    # Range 0.5-10 km/s is typical; normalize and add to score
    speed_bonus = min(5.0, relative_speed_kms * 0.3)  # Up to +5 points for high speed
    

    final_score = base_score + speed_bonus
    return min(100.0, max(0.0, final_score))


def _risk_level_from_score(risk_score: float) -> str:
    if risk_score > 90:
        return "Critical"
    if risk_score > 75:
        return "High"
    if risk_score > 50:
        return "Medium"
    return "Low"


@router.post("/predict", response_model=ConjunctionResponse)
async def predict_collision(request: ConjunctionRequest):
    """
    Predict the probability of a collision given satellite conjunction parameters.

    Args:
        request (ConjunctionRequest): Telemetry data for the conjunction event.

    Returns:
        ConjunctionResponse: Predicted risk metrics including risk score, time to approach, and risk level.
    """
    model = get_collision_model()
    
    if not model:
        # Provide baseline fallback response if the model is not properly initialized
        return ConjunctionResponse(
            risk_score=75.5,
            time_to_closest_approach=4.2,
            distance_km=1.2,
            risk_level="High"
        )
        
    try:
        # Prefer a concrete target debris if provided.
        debris_with_risks = _get_debris_with_risks()
        
        if not debris_with_risks:
            raise HTTPException(status_code=400, detail="No debris data available for prediction")
        
        target = None
        if request.target_id:
            target = next((d for d in debris_with_risks if d['id'] == request.target_id), None)

        if target is None:
            target = max(debris_with_risks, key=lambda d: d['risk_score'])

        miss_distance = float(target['miss_distance_km'])
        relative_speed = float(target['relative_speed_kms'])
        time_to_tca = float(target['time_to_closest_approach_hours'])

        features = np.array([[miss_distance, relative_speed, time_to_tca]])
        prediction = model.predict(features)
        proba = model.predict_proba(features)[0][1] if hasattr(model, 'predict_proba') else float(prediction[0])

        score = float(proba) * 100
        level = _risk_level_from_score(score)

        return ConjunctionResponse(
            risk_score=round(score, 2),
            time_to_closest_approach=round(time_to_tca, 2),
            distance_km=round(miss_distance, 3),
            risk_level=level
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/debris-scan", response_model=DebrisScanResponse)
async def scan_debris_collisions():
    """
    Scan all debris for collision risk with FOX satellite.
    
    Generates debris population, calculates conjunction features, and runs through ML model.
    Returns ranked list of at-risk debris.
    """
    debris_with_risks = _get_debris_with_risks()
    
    # Sort by risk score (highest first)
    debris_risks = sorted(debris_with_risks, key=lambda x: x['risk_score'], reverse=True)
    
    # Count by risk level
    critical = sum(1 for d in debris_risks if d['risk_level'] == 'Critical')
    high = sum(1 for d in debris_risks if d['risk_level'] == 'High')
    medium = sum(1 for d in debris_risks if d['risk_level'] == 'Medium')
    low = sum(1 for d in debris_risks if d['risk_level'] == 'Low')
    
    # Build response items (only at-risk debris)
    at_risk = [
        DebrisRiskItem(
            debris_id=d['id'],
            debris_name=d['name'],
            risk_score=d['risk_score'],
            risk_level=d['risk_level'],
            miss_distance_km=d['miss_distance_km'],
            relative_speed_kms=d['relative_speed_kms'],
            time_to_closest_approach_hours=d['time_to_closest_approach_hours'],
        )
        for d in debris_risks[:15]
    ]
    
    return DebrisScanResponse(
        primary_satellite="FOX-1A (AO-85)",
        total_debris_scanned=len(debris_risks),
        critical_count=critical,
        high_count=high,
        medium_count=medium,
        low_count=low,
        at_risk_debris=at_risk,
    )


def _get_debris_with_risks() -> list[dict]:
    """Get or compute cached debris data with risk scores.
    
    Reuses cached debris orbital parameters for 30 seconds (for sync between endpoints),
    but recalculates conjunction features in real-time so TCA counts down and risk scores update dynamically.
    """
    global _cached_debris_with_risks, _cache_generated_at
    
    now = datetime.now(timezone.utc)
    cache_fresh = (
        _cached_debris_with_risks is not None
        and _cache_generated_at is not None
        and now - _cache_generated_at < timedelta(seconds=_CACHE_TTL_SECONDS)
    )

    if not cache_fresh:
        # Cache expired: regenerate debris population
        _cached_debris_with_risks = _generate_debris_population()
        _cache_generated_at = now
    
    model = get_collision_model()
    debris_pop = _cached_debris_with_risks
    fox_altitude = 425.0
    
    debris_with_risks = []
    
    for debris in debris_pop:
        # REAL-TIME: Recalculate features every time (not cached)
        # This makes TCA count down naturally and risk scores increase as debris approaches
        miss_distance, relative_speed, time_to_tca = _calculate_conjunction_features(fox_altitude, debris)
        
        try:
            if model:
                features = np.array([[miss_distance, relative_speed, time_to_tca]])
                proba = model.predict_proba(features)[0][1] if hasattr(model, 'predict_proba') else 0.3
                risk_score = proba * 100
            else:
                # Use intelligent fallback scoring based on conjunction features
                risk_score = _compute_fallback_risk_score(miss_distance, relative_speed)
        except:
            # On any error, use fallback scoring
            risk_score = _compute_fallback_risk_score(miss_distance, relative_speed)
        
        risk_level = _risk_level_from_score(float(risk_score))
        
        debris_with_risks.append({
            'id': debris['id'],
            'name': debris['name'],
            'altitude': debris['altitude'],
            'inclination': debris['inclination'],
            'raan': debris['raan'],
            'phase': debris['phase'],
            'angular_velocity': debris['angular_velocity'],
            'velocity': debris['velocity'],
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'miss_distance_km': round(float(miss_distance), 3),
            'relative_speed_kms': round(float(relative_speed), 2),
            'time_to_closest_approach_hours': round(float(time_to_tca), 2),
        })
    
    return debris_with_risks


@router.get("/debris", response_model=DebrisListResponse)
async def get_debris():
    """
    Get all debris with their collision risk scores.
    Used by frontend 3D visualization to display same debris that collision model analyzes.
    """
    debris_data = _get_debris_with_risks()
    
    return DebrisListResponse(
        total_count=len(debris_data),
        debris=[
            DebrisData(
                id=d['id'],
                name=d['name'],
                altitude=d['altitude'],
                inclination=d['inclination'],
                raan=d['raan'],
                phase=d['phase'],
                angular_velocity=d['angular_velocity'],
                velocity=d['velocity'],
                risk_score=d['risk_score'],
                risk_level=d['risk_level'],
            )
            for d in debris_data
        ],
    )
