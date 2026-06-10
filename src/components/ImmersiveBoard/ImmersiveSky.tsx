import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from 'three';

interface ImmersiveSkyProps {
  activeZone: number;
  center: Vector3Tuple;
}

// Smooth, painterly sky palette per zone: [top, mid, horizon].
// These drive both the gradient dome and the scene fog/background so the
// whole frame reads as one cohesive, polished atmosphere — not flat color.
const ZONE_SKY: { top: string; mid: string; horizon: string }[] = [
  // Green Meadow — bright sunny afternoon
  { top: '#3f86d6', mid: '#7ec0ee', horizon: '#dcefff' },
  // Crystal Caves — deep cavern twilight (lets the starfield read)
  { top: '#070617', mid: '#171436', horizon: '#3a2f63' },
  // Volcanic Ridge — smoky dusk with an ember-lit horizon
  { top: '#170a12', mid: '#3a1614', horizon: '#7a3115' },
  // Sky Islands — airy high-altitude blue
  { top: '#5aa6e6', mid: '#a9d6f6', horizon: '#f1faff' },
  // The Summit — dramatic dawn: violet zenith melting into gold
  { top: '#160e3a', mid: '#3a2168', horizon: '#f0a64a' },
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
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    // lower hemisphere: horizon -> mid ; upper hemisphere: mid -> top
    vec3 lower = mix(uHorizon, uMid, smoothstep(-0.35, 0.12, h));
    vec3 col = mix(lower, uTop, smoothstep(0.12, 0.85, h));
    gl_FragColor = vec4(col, 1.0);
  }
`;

const _target = {
  top: new THREE.Color(),
  mid: new THREE.Color(),
  horizon: new THREE.Color(),
};

export function ImmersiveSky({ activeZone, center }: ImmersiveSkyProps) {
  const { scene, camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => {
      const z = ZONE_SKY[activeZone] ?? ZONE_SKY[0];
      return {
        uTop: { value: new THREE.Color(z.top) },
        uMid: { value: new THREE.Color(z.mid) },
        uHorizon: { value: new THREE.Color(z.horizon) },
      };
    },
    // intentionally only created once — colors are animated imperatively below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    const z = ZONE_SKY[activeZone] ?? ZONE_SKY[0];
    _target.top.set(z.top);
    _target.mid.set(z.mid);
    _target.horizon.set(z.horizon);

    // Smoothly cross-fade the sky as the player crosses into a new zone
    const k = Math.min(1, delta * 1.8);
    uniforms.uTop.value.lerp(_target.top, k);
    uniforms.uMid.value.lerp(_target.mid, k);
    uniforms.uHorizon.value.lerp(_target.horizon, k);

    // Keep the dome centered on the camera so it always feels infinite
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position);
    }

    // Drive fog + background from the (lerped) horizon color for a seamless blend.
    // Distant low-poly decorations dissolve into the horizon instead of standing out.
    if (!(scene.fog instanceof THREE.Fog)) {
      scene.fog = new THREE.Fog(uniforms.uHorizon.value.getHex(), 26, 95);
    }
    (scene.fog as THREE.Fog).color.copy(uniforms.uHorizon.value);
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
      <sphereGeometry args={[1, 32, 24]} />
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
