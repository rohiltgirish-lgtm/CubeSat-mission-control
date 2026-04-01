# CubeSat Telemetry Anomaly and Collision Pre-Alert System

## Project Overview
The CubeSat Mission Control System is a comprehensive, real-time platform designed for Space Situational Awareness (SSA). It provides satellite monitoring, anomaly detection through machine learning ensembles, and orbital collision risk assessment. The system integrates 3D visualization using Three.js with a FastAPI-driven backend to deliver predictive insights for orbital operations.

## System Demonstration
![System Demo](docs/assets/demo_video.mp4)

## Problem Statement
The rapid proliferation of CubeSats has led to significant orbital congestion. Current mission control challenges include:
- **Telemetry Underutilization**: Massive data streams are often collected without automated AI-driven monitoring.
- **Reactive Systems**: Most traditional systems rely on static thresholds and react only after a failure occurs.
- **Cost and Accessibility**: Highly accurate collision prediction tools are often proprietary, costly, and difficult to integrate.
- **Fragmented Insights**: A lack of unified systems that combine both internal hardware health (telemetry) and external threats (collisions).

## Core Modules

### 1. Telemetry Anomaly Detection
This module monitors the internal health of the CubeSat through a multi-model ensemble designed for outlier-resistant feature detection.
- **Ensemble Architecture**: Combines Isolation Forest, Autoencoder (MLP), and XGBoost.
- **Feature Engineering**: Calculates statistical moments including Mean, Standard Deviation, Maximum, Minimum, Skewness, and Kurtosis.
- **Robust Processing**: Utilizes a RobustScaler to ensure reliability against hardware-induced noise and outliers.
- **Meta-Model**: A Logistic Regression classifier aggregates base model outputs into a unified anomaly probability score, optimized via F1-score analysis for high-precision alerting.

### 2. Collision Detection and Risk Assessment
The collision engine performs real-time evaluation of orbital threats using precise conjunction features.
- **Input Parameters**: Analyzes Miss Distance, Relative Velocity, and Time-to-Closest Approach (TCA).
- **Core Model**: A Random Forest classifier selected for high-speed inference and low-latency performance in mission-critical environments.
- **Risk Stratification**: Outputs are mapped to discrete risk tiers: Critical, High, Medium, and Low.
- **Resilience**: Integrated fallback logic ensures system reliability even in scenarios where specific machine learning dependencies are unavailable.

## End-to-End Pipeline
The system operates through an integrated data and ML pipeline:
1. **Ingestion**: Automated ingestion of telemetry streams and orbital elements via REST APIs.
2. **Feature Engineering**: Real-time calculation of temporal and statistical features.
3. **ML Inference**: Dual-engine processing for anomaly detection and collision risk.
4. **Alert Engine**: Threshold-based triggers that provide proactive warnings to operators.
5. **Monitoring Layer**: A centralized dashboard and API for comprehensive fleet management.

## Workspace Structure
- **frontend/**: React interface for real-time 3D visualization and status monitoring.
- **backend/**: FastAPI service orchestrating the ML inference and data ingestion cycles.
- **ml-model/**: Development environment for model training and dataset management.
- **models/**: Centralized repository for serialized ensemble and classification models.
- **docs/**: Technical specifications and API documentation.

## Deployment and Setup
For detailed installation and configuration instructions, please refer to the technical guides provided in the repository:
- [Technical Specification](docs/TECHNICAL_SPECIFICATION.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
