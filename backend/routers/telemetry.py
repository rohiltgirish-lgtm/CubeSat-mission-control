from fastapi import APIRouter, HTTPException
from schemas.api_models import (
    AlertPayload,
    AnomalyPredictionRequest,
    AnomalyPredictionResponse,
    AnomalyScenario,
    AnomalyScenariosResponse,
    LiveTelemetryResponse,
    TelemetryGenerationRequest,
    TelemetryGenerationResponse,
    TelemetryPoint,
)
from ml.model_store import get_ensemble
import numpy as np
import pandas as pd
from datetime import datetime
from uuid import uuid4
from typing import Literal

router = APIRouter()

_fallback_score = 18.0
_telemetry_stream = [
    TelemetryPoint(time='00:00', temperature=29.2, voltage=5.03, signal=-58),
    TelemetryPoint(time='00:01', temperature=29.5, voltage=5.01, signal=-59),
    TelemetryPoint(time='00:02', temperature=29.9, voltage=5.00, signal=-60),
    TelemetryPoint(time='00:03', temperature=30.1, voltage=4.98, signal=-61),
    TelemetryPoint(time='00:04', temperature=30.4, voltage=4.97, signal=-59),
    TelemetryPoint(time='00:05', temperature=30.0, voltage=4.99, signal=-57),
    TelemetryPoint(time='00:06', temperature=30.3, voltage=4.96, signal=-58),
    TelemetryPoint(time='00:07', temperature=29.8, voltage=4.98, signal=-60),
]
_telemetry_labels = ['00:08', '00:09', '00:10', '00:11', '00:12', '00:13']


def _build_backend_alert(score: float, point: TelemetryPoint) -> AlertPayload:
    if score > 80:
        severity = "Critical"
    elif score > 65:
        severity = "High"
    elif score > 50:
        severity = "Medium"
    else:
        severity = "Low"

    title_map = {
        "Critical": "Critical anomaly detected",
        "High": "High anomaly score",
        "Medium": "Anomaly threshold crossed",
        "Low": "Nominal deviation noted",
    }

    return AlertPayload(
        id=str(uuid4()),
        timestamp=datetime.now().strftime("%H:%M:%S"),
        severity=severity,
        title=title_map[severity],
        description=(
            f"ML Score: {round(score)} — Temp: {point.temperature:.1f}°C | "
            f"Voltage: {point.voltage:.2f} V | Signal: {point.signal} dBm"
        ),
    )


def _create_next_point(previous: TelemetryPoint, index: int) -> TelemetryPoint:
    return _create_next_point_with_scenario(previous, index, 'mixed')


def _create_next_point_with_scenario(previous: TelemetryPoint, index: int, scenario: Literal['normal', 'mixed', 'anomaly']) -> TelemetryPoint:
    swing = np.sin(pd.Timestamp.utcnow().timestamp() / 3 + index) * 0.5

    temperature = previous.temperature + 0.05 + swing * 0.12 + np.random.normal(0, 0.22)
    voltage = previous.voltage - 0.003 + swing * 0.005 + np.random.normal(0, 0.012)
    signal = previous.signal + swing * 1.1 + np.random.normal(0, 1.1)

    # Occasionally inject plausible subsystem disturbances so the model output is dynamic.
    inject_disturbance = scenario == 'anomaly' or (scenario == 'mixed' and np.random.rand() < 0.14)
    if inject_disturbance:
        mode = np.random.choice(['thermal', 'power', 'comms'])
        if mode == 'thermal':
            temperature += np.random.uniform(6.0, 12.0) if scenario == 'anomaly' else np.random.uniform(3.0, 8.0)
            voltage -= np.random.uniform(0.02, 0.06) if scenario == 'anomaly' else 0
        elif mode == 'power':
            voltage -= np.random.uniform(0.22, 0.45) if scenario == 'anomaly' else np.random.uniform(0.15, 0.35)
            temperature += np.random.uniform(0.4, 1.2) if scenario == 'anomaly' else 0
        else:
            signal -= np.random.uniform(10.0, 22.0) if scenario == 'anomaly' else np.random.uniform(6.0, 14.0)
            temperature += np.random.uniform(0.2, 0.9) if scenario == 'anomaly' else 0

        if scenario == 'anomaly':
            # Force the anomaly scenario to be visibly different across all telemetry channels.
            temperature += np.random.uniform(2.0, 5.0)
            voltage -= np.random.uniform(0.08, 0.18)
            signal -= np.random.uniform(3.0, 9.0)

    temperature = np.clip(temperature, 24, 42)
    voltage = np.clip(voltage, 4.4, 5.25)
    signal = np.clip(signal, -105, -30)

    return TelemetryPoint(
        time=_telemetry_labels[index % len(_telemetry_labels)],
        temperature=round(float(temperature), 1),
        voltage=round(float(voltage), 2),
        signal=round(float(signal), 0),
    )


def _generate_telemetry_batch(
    seed_stream: list[TelemetryPoint],
    samples: int,
    scenario: Literal['normal', 'mixed', 'anomaly'],
) -> list[TelemetryPoint]:
    generated_stream = list(seed_stream)
    for offset in range(samples):
        generated_stream.append(_create_next_point_with_scenario(generated_stream[-1], len(generated_stream) + offset, scenario))
    return generated_stream


def _infer_from_telemetry(telemetry: list[TelemetryPoint]):
    global _fallback_score

    ensemble = get_ensemble()

    if not ensemble["autoencoder"] or not ensemble["iso"] or not ensemble["xgb"] or not ensemble["meta"] or not ensemble["scaler"]:
        _fallback_score = max(8.0, min(96.0, round(_fallback_score * 0.7 + np.random.uniform(-4, 10))))
        return {
            "score": _fallback_score,
            "is_anomaly": _fallback_score > 70,
            "details": "Mock prediction: Real Stacking Ensemble components not found in models/ folder.",
        }

    data = []
    for p in telemetry:
        data.append({
            "temperature": p.temperature,
            "voltage": p.voltage,
            "signal": p.signal,
        })

    df = pd.DataFrame(data)
    df['row_mean'] = df.mean(axis=1)
    df['row_std'] = df.std(axis=1)
    df['row_max'] = df.max(axis=1)
    df['row_min'] = df.min(axis=1)
    df['skew'] = df.skew(axis=1)
    df['kurt'] = df.kurtosis(axis=1)

    X = ensemble["scaler"].transform(df)
    latest_X = X[-1].reshape(1, -1)

    recon = ensemble["autoencoder"].predict(latest_X)
    ae_error = np.mean(np.square(latest_X - recon), axis=1)
    iso_score = -ensemble["iso"].score_samples(latest_X)
    xgb_score = ensemble["xgb"].predict_proba(latest_X)[:, 1]

    stack_X = np.vstack([ae_error, iso_score, xgb_score]).T
    final_score = ensemble["meta"].predict_proba(stack_X)[0, 1]
    is_anomaly = float(final_score) > ensemble["threshold"]

    return {
        "score": round(float(final_score) * 100, 2),
        "is_anomaly": bool(is_anomaly),
        "details": f"Inference using Advanced Ensemble. Threshold: {ensemble['threshold']:.4f}",
    }

@router.post("/predict", response_model=AnomalyPredictionResponse)
async def predict_anomaly(request: AnomalyPredictionRequest):
    global _fallback_score

    try:
        result = _infer_from_telemetry(request.telemetry)
        return AnomalyPredictionResponse(
            score=result["score"],
            is_anomaly=result["is_anomaly"],
            details=result["details"],
        )
    except Exception as e:
        print(f"Exception during prediction: {e}")
        # Graceful fallback if the DataFrame shapes don't match (e.g. if the Colab CSV had 10 columns and we only sent 3)
        _fallback_score = max(8.0, min(96.0, round(_fallback_score * 0.7 + np.random.uniform(-4, 10))))
        return AnomalyPredictionResponse(
            score=_fallback_score,
            is_anomaly=False,
            details=f"Prediction failed (shape mismatch?). Falling back to mock. Error: {str(e)}"
        )


@router.get("/live", response_model=LiveTelemetryResponse)
async def get_live_telemetry_and_prediction(scenario: Literal['normal', 'mixed', 'anomaly'] = 'mixed'):
    global _telemetry_stream

    next_point = _create_next_point_with_scenario(_telemetry_stream[-1], len(_telemetry_stream), scenario)
    _telemetry_stream = [*_telemetry_stream[1:], next_point]

    result = _infer_from_telemetry(_telemetry_stream)
    alert_payload = _build_backend_alert(result["score"], _telemetry_stream[-1]) if result["is_anomaly"] else None

    return LiveTelemetryResponse(
        telemetry=_telemetry_stream,
        score=result["score"],
        is_anomaly=result["is_anomaly"],
        details=result["details"],
        alert=alert_payload,
    )


@router.post("/generate", response_model=TelemetryGenerationResponse)
async def generate_telemetry(request: TelemetryGenerationRequest):
    batch = _generate_telemetry_batch(_telemetry_stream, request.samples, request.scenario)
    result = _infer_from_telemetry(batch)
    alert_payload = _build_backend_alert(result["score"], batch[-1]) if result["is_anomaly"] else None

    return TelemetryGenerationResponse(
        scenario=request.scenario,
        telemetry=batch,
        score=result["score"],
        is_anomaly=result["is_anomaly"],
        details=result["details"],
        alert=alert_payload,
    )


@router.get("/anomaly-scenarios", response_model=AnomalyScenariosResponse)
async def get_anomaly_scenarios():
    """
    Generate and return pre-computed anomaly scenarios for visualization.
    
    Returns 4 scenarios:
    - Normal: Healthy telemetry baseline
    - Thermal spike: Temperature anomaly (overheating)
    - Voltage drop: Power system degradation
    - Signal loss: Communication issue
    
    Each scenario includes ML anomaly score and alert payload.
    """
    scenarios = []
    
    # Scenario 1: NORMAL
    normal_batch = _generate_telemetry_batch(_telemetry_stream, 8, 'normal')
    normal_result = _infer_from_telemetry(normal_batch)
    normal_alert = _build_backend_alert(normal_result["score"], normal_batch[-1]) if normal_result["is_anomaly"] else None
    
    scenarios.append(AnomalyScenario(
        scenario_type='normal',
        description='Nominal system operation with expected sensor variance',
        telemetry=normal_batch,
        score=normal_result["score"],
        is_anomaly=normal_result["is_anomaly"],
        alert=normal_alert,
    ))
    
    # Scenario 2: THERMAL SPIKE
    thermal_batch = []
    for i in range(8):
        pt = _telemetry_stream[i % len(_telemetry_stream)]
        thermal_batch.append(TelemetryPoint(
            time=_telemetry_labels[i % len(_telemetry_labels)],
            temperature=pt.temperature + np.random.uniform(10, 20),  # Spike
            voltage=pt.voltage - np.random.uniform(0.02, 0.08),  # Secondary degradation
            signal=pt.signal + np.random.uniform(-2, 2),
        ))
    thermal_result = _infer_from_telemetry(thermal_batch)
    thermal_alert = _build_backend_alert(thermal_result["score"], thermal_batch[-1]) if thermal_result["is_anomaly"] else None
    
    scenarios.append(AnomalyScenario(
        scenario_type='thermal_spike',
        description='Thermal anomaly: component overheating detected (+10-20°C)',
        telemetry=thermal_batch,
        score=thermal_result["score"],
        is_anomaly=thermal_result["is_anomaly"],
        alert=thermal_alert,
    ))
    
    # Scenario 3: VOLTAGE DROP
    voltage_batch = []
    for i in range(8):
        pt = _telemetry_stream[i % len(_telemetry_stream)]
        voltage_batch.append(TelemetryPoint(
            time=_telemetry_labels[i % len(_telemetry_labels)],
            temperature=pt.temperature + np.random.uniform(0.5, 2.5),  # Secondary effect
            voltage=pt.voltage - np.random.uniform(0.25, 0.45),  # Major drop
            signal=pt.signal - np.random.uniform(3, 8),  # Signal degradation
        ))
    voltage_result = _infer_from_telemetry(voltage_batch)
    voltage_alert = _build_backend_alert(voltage_result["score"], voltage_batch[-1]) if voltage_result["is_anomaly"] else None
    
    scenarios.append(AnomalyScenario(
        scenario_type='voltage_drop',
        description='Power anomaly: voltage degradation (-0.25-0.45V, sign of battery issue)',
        telemetry=voltage_batch,
        score=voltage_result["score"],
        is_anomaly=voltage_result["is_anomaly"],
        alert=voltage_alert,
    ))
    
    # Scenario 4: SIGNAL LOSS
    signal_batch = []
    for i in range(8):
        pt = _telemetry_stream[i % len(_telemetry_stream)]
        signal_batch.append(TelemetryPoint(
            time=_telemetry_labels[i % len(_telemetry_labels)],
            temperature=pt.temperature + np.random.uniform(1, 4),
            voltage=pt.voltage - np.random.uniform(0.05, 0.12),
            signal=pt.signal - np.random.uniform(12, 25),  # Major signal loss
        ))
    signal_result = _infer_from_telemetry(signal_batch)
    signal_alert = _build_backend_alert(signal_result["score"], signal_batch[-1]) if signal_result["is_anomaly"] else None
    
    scenarios.append(AnomalyScenario(
        scenario_type='signal_loss',
        description='Comms anomaly: signal loss detected (-12-25 dBm degradation)',
        telemetry=signal_batch,
        score=signal_result["score"],
        is_anomaly=signal_result["is_anomaly"],
        alert=signal_alert,
    ))
    
    return AnomalyScenariosResponse(scenarios=scenarios)
