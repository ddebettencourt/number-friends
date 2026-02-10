export interface ZoneConfig {
  name: string;
  startSquare: number;
  endSquare: number;
  groundColor: string;
  tileColor: string;
  tileRoughness: number;
  tileMetalness: number;
  emissiveColor: string;
  emissiveIntensity: number;
  fogColor: string;
  fogDensity: number;
  accentLightColor: string;
  elevationStart: number;
  elevationEnd: number;
  pathColor: string;
  pathRadius: number;
}

export const ZONES: ZoneConfig[] = [
  {
    name: 'Green Meadow',
    startSquare: 1,
    endSquare: 20,
    groundColor: '#4a7c59',
    tileColor: '#8B7355',
    tileRoughness: 0.6,
    tileMetalness: 0.05,
    emissiveColor: '#2d5a27',
    emissiveIntensity: 0.05,
    fogColor: '#87CEEB',
    fogDensity: 0.02,
    accentLightColor: '#7ec850',
    elevationStart: 0,
    elevationEnd: 0.5,
    pathColor: '#c9a96e',
    pathRadius: 0.16,
  },
  {
    name: 'Crystal Caves',
    startSquare: 21,
    endSquare: 40,
    groundColor: '#2a2a3e',
    tileColor: '#6a5acd',
    tileRoughness: 0.1,
    tileMetalness: 0.5,
    emissiveColor: '#7b68ee',
    emissiveIntensity: 0.25,
    fogColor: '#1a1a3e',
    fogDensity: 0.04,
    accentLightColor: '#9370db',
    elevationStart: 0.5,
    elevationEnd: -1,
    pathColor: '#4a3a6e',
    pathRadius: 0.15,
  },
  {
    name: 'Volcanic Ridge',
    startSquare: 41,
    endSquare: 60,
    groundColor: '#1a1a1a',
    tileColor: '#3d3d3d',
    tileRoughness: 0.9,
    tileMetalness: 0.15,
    emissiveColor: '#ff4500',
    emissiveIntensity: 0.2,
    fogColor: '#2a1a0a',
    fogDensity: 0.03,
    accentLightColor: '#ff6b35',
    elevationStart: -1,
    elevationEnd: 2,
    pathColor: '#5a3a2a',
    pathRadius: 0.18,
  },
  {
    name: 'Sky Islands',
    startSquare: 61,
    endSquare: 80,
    groundColor: '#b0c4de',
    tileColor: '#e8e0d0',
    tileRoughness: 0.15,
    tileMetalness: 0.1,
    emissiveColor: '#b0d4f1',
    emissiveIntensity: 0.1,
    fogColor: '#c0d8f0',
    fogDensity: 0.02,
    accentLightColor: '#e0f0ff',
    elevationStart: 2,
    elevationEnd: 4,
    pathColor: '#d4c5a9',
    pathRadius: 0.12,
  },
  {
    name: 'The Summit',
    startSquare: 81,
    endSquare: 100,
    groundColor: '#c8a84e',
    tileColor: '#f0e68c',
    tileRoughness: 0.05,
    tileMetalness: 0.7,
    emissiveColor: '#ffd700',
    emissiveIntensity: 0.15,
    fogColor: '#2a2040',
    fogDensity: 0.01,
    accentLightColor: '#ffd700',
    elevationStart: 4,
    elevationEnd: 5,
    pathColor: '#d4aa50',
    pathRadius: 0.14,
  },
];

export function getZoneForSquare(squareNumber: number): ZoneConfig {
  for (const zone of ZONES) {
    if (squareNumber >= zone.startSquare && squareNumber <= zone.endSquare) {
      return zone;
    }
  }
  return ZONES[0];
}

export function getZoneIndex(squareNumber: number): number {
  for (let i = 0; i < ZONES.length; i++) {
    if (squareNumber >= ZONES[i].startSquare && squareNumber <= ZONES[i].endSquare) {
      return i;
    }
  }
  return 0;
}

export function getZoneProgress(squareNumber: number): number {
  const zone = getZoneForSquare(squareNumber);
  const zoneLength = zone.endSquare - zone.startSquare;
  if (zoneLength === 0) return 0;
  return (squareNumber - zone.startSquare) / zoneLength;
}

export function getElevationForSquare(squareNumber: number): number {
  const zone = getZoneForSquare(squareNumber);
  const progress = getZoneProgress(squareNumber);
  return zone.elevationStart + (zone.elevationEnd - zone.elevationStart) * progress;
}
