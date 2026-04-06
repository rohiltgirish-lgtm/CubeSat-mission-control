export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type SystemStatus = 'Connected' | 'Warning' | 'Critical';

export type TelemetryPoint = {
  time: string;
  temperature: number;
  voltage: number;
  signal: number;
};

export type AlertItem = {
  id: string;
  timestamp: string;
  severity: Severity;
  title: string;
  description: string;
};

export type SatelliteSummary = {
  name: string;
  health: 'Nominal' | 'Watch' | 'Critical';
  lastUpdated: string;
};

export type CollisionSummary = {
  closestObject: string;
  timeToClosestApproach: string;
  distanceKm: number;
  riskLevel: 'Low' | 'Medium' | 'High';
};

export type SpaceObjectStatus = 'Nominal' | 'Watch' | 'Avoidance';

export type OrbitalElements = {
  inclinationDeg: number;
  raanDeg: number;
  phaseDeg: number;
  angularVelocityDeg: number;
};

export type OrbitSource =
  | {
      kind: 'tle';
      line1: string;
      line2: string;
    }
  | {
      kind: 'elements';
      elements: OrbitalElements;
    };

export type GeodeticSnapshot = {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
};

export type SpaceObject = {
  id: string;
  name: string;
  type: 'satellite' | 'debris';
  noradId?: number;
  altitude: number;
  orbit: OrbitSource;
  size: number;
  color: string;
  status: SpaceObjectStatus;
  telemetry: {
    battery: number;
    temperature: number;
    velocity: number;
    signal: number;
  };
};