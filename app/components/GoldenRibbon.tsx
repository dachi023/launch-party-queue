import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  center?: [number, number, number];
  length?: number;
  amplitude?: number;
  thickness?: number;
  color?: string;
  phase?: number;
  speed?: number;
};

/** A slowly waving golden / metallic ribbon. */
export function GoldenRibbon({
  center = [0, 0, 0],
  length = 5,
  amplitude = 1.6,
  thickness = 0.04,
  color = "#f4c45c",
  phase = 0,
  speed = 0.25,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Vector3[]>([]);

  // Sample the curve once
  const segments = 80;
  if (baseRef.current.length === 0) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * length;
      const y = Math.sin(t * Math.PI * 4 + phase) * amplitude * (0.6 + 0.4 * Math.sin(t * Math.PI));
      const z = Math.cos(t * Math.PI * 3 + phase * 1.7) * amplitude * 0.5;
      baseRef.current.push(new THREE.Vector3(x, y, z));
    }
  }

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(baseRef.current);
    return new THREE.TubeGeometry(curve, segments * 2, thickness, 6, false);
  }, [thickness]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const x = (u - 0.5) * length;
      const y =
        Math.sin(u * Math.PI * 4 + phase + t) * amplitude *
        (0.6 + 0.4 * Math.sin(u * Math.PI + t * 0.5));
      const z =
        Math.cos(u * Math.PI * 3 + phase * 1.7 + t * 0.8) * amplitude * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const newGeo = new THREE.TubeGeometry(curve, segments * 2, thickness, 6, false);
    if (meshRef.current) {
      const old = meshRef.current.geometry;
      meshRef.current.geometry = newGeo;
      old.dispose();
    }
  });

  return (
    <mesh ref={meshRef} position={center} geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        metalness={0.9}
        roughness={0.18}
        clearcoat={0.6}
        envMapIntensity={1.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
