from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TelemetryPoint(BaseModel):
    time: str
    temperature: float
    voltage: float
    signal: float
    # We can add more fields like battery, velocity if needed for the model

class AnomalyPredictionRequest(BaseModel):
    telemetry: List[TelemetryPoint]

class AnomalyPredictionResponse(BaseModel):
    score: float
    is_anomaly: bool
    details: Optional[str] = None

class AlertPayload(BaseModel):
    id: str
    timestamp: str
    severity: str
    title: str
    description: str

class LiveTelemetryResponse(BaseModel):
    telemetry: List[TelemetryPoint]
    score: float
    is_anomaly: bool
    details: Optional[str] = None
    alert: Optional[AlertPayload] = None

class TelemetryGenerationRequest(BaseModel):
    scenario: Literal['normal', 'mixed', 'anomaly'] = 'mixed'
    samples: int = Field(default=8, ge=1, le=24)

class TelemetryGenerationResponse(BaseModel):
    scenario: Literal['normal', 'mixed', 'anomaly']
    telemetry: List[TelemetryPoint]
    score: float
    is_anomaly: bool
    details: Optional[str] = None
    alert: Optional[AlertPayload] = None

class AnomalyScenario(BaseModel):
    """Individual anomaly scenario with its ML inference result."""
    scenario_type: Literal['thermal_spike', 'voltage_drop', 'signal_loss', 'normal']
    description: str
    telemetry: List[TelemetryPoint]
    score: float
    is_anomaly: bool
    alert: Optional[AlertPayload] = None

class AnomalyScenariosResponse(BaseModel):
    """Response containing multiple anomaly scenarios for visualization."""
    scenarios: List[AnomalyScenario]

class ConjunctionRequest(BaseModel):
    satellite_id: str
    target_id: Optional[str] = None
    time_window_hours: float = 24.0

class ConjunctionResponse(BaseModel):
    risk_score: float
    time_to_closest_approach: float
    distance_km: float
    risk_level: str

class DebrisRiskItem(BaseModel):
    debris_id: str
    debris_name: str
    risk_score: float
    risk_level: str
    miss_distance_km: float
    relative_speed_kms: float
    time_to_closest_approach_hours: float

class DebrisScanResponse(BaseModel):
    primary_satellite: str
    total_debris_scanned: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    at_risk_debris: List[DebrisRiskItem]

class DebrisData(BaseModel):
    id: str
    name: str
    altitude: float
    inclination: float
    raan: float
    phase: float
    angular_velocity: float
    velocity: float
    risk_score: float
    risk_level: str

class DebrisListResponse(BaseModel):
    total_count: int
    debris: List[DebrisData]
