import { Vector3 } from 'three';
import * as satellite from 'satellite.js';
import { GeodeticSnapshot, SpaceObject } from '../../types';

const EARTH_RADIUS_UNITS = 1.7;
const EARTH_RADIUS_KM = 6371;
const ALTITUDE_EXAGGERATION = 2.2;
const LONGITUDE_OFFSET_DEG = 0;
const EARTH_ROTATION_RATE_DEG_PER_SEC = 0.02;
const tleCache = new Map<string, { satrec: satellite.SatRec; line1: string; line2: string }>();

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeLongitudeDeg(value: number) {
  let normalized = value % 360;
  if (normalized > 180) {
    normalized -= 360;
  }
  if (normalized < -180) {
    normalized += 360;
  }
  return normalized;
}

export function geodeticToCartesian(latitudeDeg: number, longitudeDeg: number, altitudeKm: number) {
  const latitude = degToRad(latitudeDeg);
  const longitude = degToRad(longitudeDeg + LONGITUDE_OFFSET_DEG);
  const radius = EARTH_RADIUS_UNITS + (altitudeKm / EARTH_RADIUS_KM) * EARTH_RADIUS_UNITS * ALTITUDE_EXAGGERATION;

  const x = radius * Math.cos(latitude) * Math.cos(longitude);
  const y = radius * Math.sin(latitude);
  const z = -radius * Math.cos(latitude) * Math.sin(longitude);

  return new Vector3(x, y, z);
}

export function getObjectGeodeticPosition(object: SpaceObject, time: number, index = 0) {
  if (object.orbit.kind === 'tle') {
    const satrec = getSatrecForObject(object);
    if (satrec) {
      const now = new Date(Date.now() + time * 1000);
      const state = satellite.propagate(satrec, now);
      if (state.position && typeof state.position === 'object' && 'x' in state.position && 'y' in state.position && 'z' in state.position) {
        const gmst = satellite.gstime(now);
        const geodetic = satellite.eciToGeodetic(state.position as satellite.EciVec3<number>, gmst);
        return {
          latitudeDeg: satellite.degreesLat(geodetic.latitude),
          longitudeDeg: normalizeLongitudeDeg(satellite.degreesLong(geodetic.longitude)),
          altitudeKm: geodetic.height,
        };
      }
    }
  }

  const elements = object.orbit.kind === 'elements' ? object.orbit.elements : { inclinationDeg: 53, raanDeg: 0, phaseDeg: 0, angularVelocityDeg: 4 };
  const inclination = degToRad(elements.inclinationDeg);
  const phase = degToRad(elements.phaseDeg + index * 13);
  const orbitalAngle = phase + degToRad(elements.angularVelocityDeg) * time;
  const raan = degToRad(elements.raanDeg);

  const latitudeRad = Math.asin(Math.sin(inclination) * Math.sin(orbitalAngle));
  const longitudeRad = raan + Math.atan2(Math.cos(inclination) * Math.sin(orbitalAngle), Math.cos(orbitalAngle)) - degToRad(EARTH_ROTATION_RATE_DEG_PER_SEC * time);

  return {
    latitudeDeg: radToDeg(latitudeRad),
    longitudeDeg: normalizeLongitudeDeg(radToDeg(longitudeRad)),
    altitudeKm: object.altitude,
  };
}

export function getObjectPosition(object: SpaceObject, time: number, index = 0) {
  const geodetic = getObjectGeodeticPosition(object, time, index);
  return geodeticToCartesian(geodetic.latitudeDeg, geodetic.longitudeDeg, geodetic.altitudeKm);
}

export function getObjectState(object: SpaceObject, time: number, index = 0): GeodeticSnapshot & { position: Vector3 } {
  const geodetic = getObjectGeodeticPosition(object, time, index);
  return {
    ...geodetic,
    position: geodeticToCartesian(geodetic.latitudeDeg, geodetic.longitudeDeg, geodetic.altitudeKm),
  };
}

export function distanceBetween(a: Vector3, b: Vector3) {
  return a.distanceTo(b);
}

function getSatrecForObject(object: SpaceObject) {
  if (object.orbit.kind !== 'tle') {
    return null;
  }

  const cached = tleCache.get(object.id);
  if (cached && cached.line1 === object.orbit.line1 && cached.line2 === object.orbit.line2) {
    return cached.satrec;
  }

  const satrec = satellite.twoline2satrec(object.orbit.line1, object.orbit.line2);
  tleCache.set(object.id, { satrec, line1: object.orbit.line1, line2: object.orbit.line2 });
  return satrec;
}