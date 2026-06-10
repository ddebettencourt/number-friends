import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

interface ImmersiveSkyProps {
  activeZone: number;
  center: Vector3Tuple;
}

// Per-zone atmosphere: gradient stops + sun + clouds + stars.
// Everything cross-fades as the player moves between zones, and drives the
// scene fog/background so the whole frame reads as one cohesive atmosphere.
interface SkyZone {
  top: string;
  mid: string;
  horizon: string;
  sunDir: Vector3Tuple;   // normalized-ish; shader normalizes
  sunColor: string;
  sunSize: number;        // angular size factor (bigger = larger disc)
  sunGlow: number;        // halo strength
  cloudCover: number;     // 0 = clear, 1 = overcast
  cloudColor: string;
  starAmt: number;        // 0..1 star visibility
  fogNear: number;
  fogFar: number;
}

const ZONE_SKY: SkyZone[] = [
  // Green Meadow — sunny early afternoon, big friendly cumulus
  {
    top: '#2f7ad1', mid: '#79bcec', horizon: '#cde6f7',
    sunDir: [0.45, 0.72, -0.3], sunColor: '#fff7d8', sunSize: 1.0, sunGlow: 0.5,
    cloudCover: 0.46, cloudColor: '#ffffff', starAmt: 0,
    fogNear: 36, fogFar: 115,
  },
  // Crystal Caves — vast violet dark, glittering "cave sky" of mineral stars
  {
    top: '#050414', mid: '#120f2e', horizon: '#2c2353',
    sunDir: [0, 1, 0], sunColor: '#000000', sunSize: 0, sunGlow: 0,
    cloudCover: 0, cloudColor: '#000000', starAmt: 0.9,
    fogNear: 18, fogFar: 70,
  },
  // Volcanic Ridge — ash dusk, smoldering red sun low on the horizon
  {
    top: '#190a10', mid: '#411812', horizon: '#8a3a14',
    sunDir: [-0.55, 0.16, -0.45], sunColor: '#ff5a26', sunSize: 1.7, sunGlow: 0.9,
    cloudCover: 0.34, cloudColor: '#3a2420', starAmt: 0.25,
    fogNear: 24, fogFar: 95,
  },
  // Sky Islands — luminous high-altitude morning above a cloud sea
  {
    top: '#2a76cc', mid: '#7cb9e8', horizon: '#c5ddf2',
    sunDir: [-0.3, 0.8, 0.25], sunColor: '#fffbe8', sunSize: 1.1, sunGlow: 0.55,
    cloudCover: 0.5, cloudColor: '#ffffff', starAmt: 0,
    fogNear: 50, fogFar: 180,
  },
  // The Summit — violet dawn melting into gold, stars still out at the zenith
  {
    top: '#120b34', mid: '#41246e', horizon: '#f5a945',
    sunDir: [0.65, 0.2, 0.1], sunColor: '#ffd27a', sunSize: 1.5, sunGlow: 0.85,
    cloudCover: 0.22, cloudColor: '#7a5a9a', starAmt: 0.6,
    fogNear: 28, fogFar: 110,
  },
];

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunSize;
  uniform float uSunGlow;
  uniform float uCloudCover;
  uniform vec3 uCloudColor;
  uniform float uStarAmt;
  uniform float uTime;
  varying vec3 vDir;

  // -- tiny hash/noise toolkit (cheap, dome-only) --
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += vnoise(p) * a;
      p = p * 2.03 + vec2(13.7, 7.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    // --- base gradient ---
    vec3 lower = mix(uHorizon, uMid, smoothstep(-0.35, 0.12, h));
    vec3 col = mix(lower, uTop, smoothstep(0.12, 0.85, h));

    // --- stars (upper hemisphere, fade toward horizon) ---
    if (uStarAmt > 0.001 && h > 0.02) {
      vec2 sp = dir.xz / (dir.y + 0.35);
      vec2 cell = floor(sp * 38.0);
      float star = step(0.985, hash21(cell));
      vec2 cuv = fract(sp * 38.0) - 0.5;
      float core = star * smoothstep(0.18, 0.02, length(cuv));
      float twinkle = 0.6 + 0.4 * sin(uTime * (1.5 + hash21(cell + 9.0) * 3.0) + hash21(cell + 4.0) * 6.28);
      col += vec3(0.9, 0.93, 1.0) * core * twinkle * uStarAmt * smoothstep(0.02, 0.25, h);
    }

    // --- sun disc + halo ---
    if (uSunSize > 0.001) {
      vec3 sd = normalize(uSunDir);
      float d = dot(dir, sd);
      float disc = smoothstep(1.0 - 0.0009 * uSunSize * uSunSize, 1.0 - 0.0002 * uSunSize, d);
      float halo = pow(clamp(d, 0.0, 1.0), 28.0 / max(uSunSize, 0.4)) * uSunGlow;
      col += uSunColor * (disc * 1.6 + halo);
    }

    // --- drifting clouds (projected planar fbm, upper hemisphere only) ---
    if (uCloudCover > 0.001 && h > 0.0) {
      vec2 cuv = dir.xz / (dir.y + 0.22);
      cuv = cuv * 1.6 + vec2(uTime * 0.006, uTime * 0.0023);
      float n = fbm(cuv);
      // second, slower layer for depth
      float n2 = fbm(cuv * 0.43 - vec2(uTime * 0.0035, 0.0));
      float cl = smoothstep(1.0 - uCloudCover, 1.0 - uCloudCover + 0.32, n * 0.62 + n2 * 0.5);
      // silver lining toward the sun
      vec3 sd2 = normalize(uSunDir);
      float lit = 0.75 + 0.45 * clamp(dot(dir, sd2), 0.0, 1.0);
      // fade clouds at the horizon so they melt into haze
      float horizonFade = smoothstep(0.0, 0.16, h);
      col = mix(col, uCloudColor * lit, cl * horizonFade * 0.92);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

const _target = {
  top: new THREE.Color(),
  mid: new THREE.Color(),
  horizon: new THREE.Color(),
  sunColor: new THREE.Color(),
  cloudColor: new THREE.Color(),
  sunDir: new THREE.Vector3(),
};

export function ImmersiveSky({ activeZone, center }: ImmersiveSkyProps) {
  const { scene, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  // Scalar params lerped imperatively alongside the colors
  const scalars = useRef({ sunSize: 1, sunGlow: 0.5, cloudCover: 0.4, starAmt: 0, fogNear: 30, fogFar: 110 });

  const uniforms = useMemo(
    () => {
      const z = ZONE_SKY[activeZone] ?? ZONE_SKY[0];
      return {
        uTop: { value: new THREE.Color(z.top) },
        uMid: { value: new THREE.Color(z.mid) },
        uHorizon: { value: new THREE.Color(z.horizon) },
        uSunDir: { value: new THREE.Vector3(...z.sunDir) },
        uSunColor: { value: new THREE.Color(z.sunColor) },
        uSunSize: { value: z.sunSize },
        uSunGlow: { value: z.sunGlow },
        uCloudCover: { value: z.cloudCover },
        uCloudColor: { value: new THREE.Color(z.cloudColor) },
        uStarAmt: { value: z.starAmt },
        uTime: { value: 0 },
      };
    },
    // intentionally created once — all params are animated imperatively below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state, delta) => {
    const z = ZONE_SKY[activeZone] ?? ZONE_SKY[0];
    _target.top.set(z.top);
    _target.mid.set(z.mid);
    _target.horizon.set(z.horizon);
    _target.sunColor.set(z.sunColor);
    _target.cloudColor.set(z.cloudColor);
    _target.sunDir.set(...z.sunDir);

    // Smoothly cross-fade the whole atmosphere between zones
    const k = Math.min(1, delta * 1.8);
    uniforms.uTop.value.lerp(_target.top, k);
    uniforms.uMid.value.lerp(_target.mid, k);
    uniforms.uHorizon.value.lerp(_target.horizon, k);
    uniforms.uSunColor.value.lerp(_target.sunColor, k);
    uniforms.uCloudColor.value.lerp(_target.cloudColor, k);
    uniforms.uSunDir.value.lerp(_target.sunDir, k);

    const s = scalars.current;
    s.sunSize += (z.sunSize - s.sunSize) * k;
    s.sunGlow += (z.sunGlow - s.sunGlow) * k;
    s.cloudCover += (z.cloudCover - s.cloudCover) * k;
    s.starAmt += (z.starAmt - s.starAmt) * k;
    s.fogNear += (z.fogNear - s.fogNear) * k;
    s.fogFar += (z.fogFar - s.fogFar) * k;
    uniforms.uSunSize.value = s.sunSize;
    uniforms.uSunGlow.value = s.sunGlow;
    uniforms.uCloudCover.value = s.cloudCover;
    uniforms.uStarAmt.value = s.starAmt;
    uniforms.uTime.value = state.clock.elapsedTime;

    // Keep the dome centered on the camera so it always feels infinite
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position);
    }

    // Fog + background follow the (lerped) horizon color, with per-zone depth.
    if (!(scene.fog instanceof THREE.Fog)) {
      scene.fog = new THREE.Fog(uniforms.uHorizon.value.getHex(), s.fogNear, s.fogFar);
    }
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(uniforms.uHorizon.value);
    fog.near = s.fogNear;
    fog.far = s.fogFar;
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = new THREE.Color();
    }
    (scene.background as THREE.Color).copy(uniforms.uHorizon.value);
  });

  // center is unused for positioning (we follow the camera) but kept in the
  // signature so the dome re-mounts cleanly if the board re-initializes.
  void center;

  return (
    <mesh ref={meshRef} scale={300} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}
