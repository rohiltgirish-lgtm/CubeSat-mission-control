# API Documentation

## Base Configuration
- **Endpoint**: `http://localhost:8000`
- **Protocol**: HTTP/1.1
- **Content Type**: `application/json`

## Telemetry Endpoints

### GET /api/telemetry/live
Retrieves real-time telemetry readings and associated anomaly scores.

#### Response Schema
- `timestamp`: string (ISO 8601)
- `temperature_celsius`: float
- `voltage_volts`: float
- `signal_dbm`: float
- `anomaly_score`: float (0.0 - 1.0)
- `is_anomaly`: boolean
- `alert`: object | null

---

### POST /api/telemetry/predict
Requests a discrete inference from the anomaly detection ensemble for specific values.

#### Request Schema
- `temperature`: float
- `voltage`: float
- `signal`: float

---

### GET /api/telemetry/anomaly-scenarios
Returns a collection of pre-defined hardware failure scenarios for testing and demonstration purposes.

---

## Collision & Conjunction Endpoints

### GET /api/collision/debris
Returns the full population of tracked debris objects with associated orbital parameters and risk assessments.

#### Response Schema
- `id`: string
- `name`: string
- `altitude`: float
- `inclination`: float
- `risk_score`: float
- `risk_level`: enum ("Critical", "High", "Medium", "Low")

---

### GET /api/collision/debris-scan
Provides a summary of total orbital threats and detailed metrics for the most critical conjunction candidates.

---

## Satellite Tracking Endpoints

### GET /api/satellites/{norad_id}/tle
Fetches the latest Two-Line Element (TLE) set for the specified NORAD ID.

---

### GET /api/satellites/{norad_id}/positions
Returns a sequence of future position predictions based on current orbital elements and observer coordinates.

#### Query Parameters
- `lat`: float (Observer latitude)
- `lng`: float (Observer longitude)
- `alt`: float (Observer altitude in km)
- `seconds`: integer (Prediction duration)

---

## Data Contracts

### Risk Level Categorization
Probability and severity are mapped to discrete levels:
- **Critical**: Score > 90.0
- **High**: Score 75.0 - 90.0
- **Medium**: Score 50.0 - 75.0
- **Low**: Score < 50.0

### Anomaly Thresholds
The default system threshold for declaring an alert state is **0.5**.
- **Normal Operating Range**: 0.0 - 0.49
- **Alert Status**: 0.5 - 1.0

## Status Codes
- `200 OK`: Request successful.
- `422 Unprocessable Entity`: Validation failure on input schema.
- `404 Not Found`: Resource (Satellite/Debris) not identified.
- `500 Internal Server Error`: Server-side failure or ML inference timeout.
