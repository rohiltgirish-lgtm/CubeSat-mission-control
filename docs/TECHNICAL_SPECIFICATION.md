# Technical Specification: CubeSat Mission Control

## System Architecture
The platform is designed as a distributed system with a decoupled frontend and backend. The architecture prioritizes high-frequency telemetry ingestion and low-latency machine learning inference.

### Component Overview
1. **Frontend**: A React-based Single Page Application (SPA). It utilizes Three.js for 3D rendering and Satellite.js for client-side orbital propagation.
2. **Backend**: A FastAPI implementation designed for asynchronous request handling. It serves as the orchestrator for ML models and external data providers (N2YO).
3. **ML Infrastructure**: A dedicated pipeline for training and serving predictive models. Inference is performed in-memory to meet real-time performance requirements.

## Machine Learning Pipelines

### Anomaly Detection Ensemble
The system employs a four-stage ensemble to identify hardware degradation in real-time telemetry streams:
1. **Autoencoder (MLPRegressor)**: Measures reconstruction error to identify deviations from "normal" operating signatures.
2. **Isolation Forest**: An unsupervised model designed to isolate anomalies based on feature space density.
3. **XGBoost Classifier**: A supervised gradient boosting model trained on historical failure signatures (Thermal spikes, Voltage drops, and Signal loss).
4. **Meta-Classifier**: A Logistic Regression model that aggregates scores from the previous stages to produce a final binary classification (Anomaly vs. Normal).

### Collision Risk Assessment
Conjunction analysis is performed by calculating physical relationships between the primary satellite and known orbital debris:
- **Miss Distance Calculation**: Radial distance at the time of closest approach (TCA).
- **Relative Speed Analysis**: Differential velocity vectors at the conjunction point.
- **Risk Scoring**: A RandomForest model trained on orbital conjunction features (miss distance, relative speed, and TCA trends).

## Real-Time Data Management

### Polling Protocols
The frontend synchronizes with the backend through variable-frequency polling based on data volatility:
- **Telemetry**: 2.4-second intervals for critical hardware monitoring.
- **Collision Data**: 15-second intervals for orbital update cycles.
- **Orbital Parameters (TLE)**: 60-second intervals to account for secular perturbations.

### Data Normalization
All incoming telemetry is processed through a `RobustScaler` to ensure feature parity across different operating regimes. This prevents extreme value outliers from disproportionately weighting the ML inference results.

## Orbital Mechanics & Visualization
The 3D visualization engine renders the inertial reference frame centered on the Earth. Objects are propagated using the SGP4 (Simplified General Perturbations) model via Satellite.js when live telemetry is unavailable.

### Visualization Tiers
- **Primary Assets**: High-fidelity rendering with live position updates.
- **Debris Population**: 100+ candidates categorized by risk level (Critical, High, Medium, Low).
- **Celestial References**: Includes Starfields and Earth texture mapping for spatial context.

## Deployment Specifications
The system is orchestrated using Docker Compose, ensuring environment parity across development, staging, and production.
- **Storage**: Initial models are loaded from serialized .pkl files into the shared `/models` volume.
- **Scalability**: The stateless nature of the FastAPI backend allows for horizontal scaling through a load balancer if required.
