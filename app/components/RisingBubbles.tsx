import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Champagne bubbles rising from below */
export function RisingBubbles({
  count = 180,
  range = 14,
}: {
  count?: number;
  range?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const seeds = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * range,
      y: -range / 2 + Math.random() * range,
      z: -2 - Math.random() * 6,
      scale: 0.02 + Math.random() * 0.08,
      vy: 0.4 + Math.random() * 0.8,
      wobble: 1.0 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, range]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const tmp = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      s.y += s.vy * delta;
      if (s.y > range / 2) {
        s.y = -range / 2;
        s.x = (Math.random() - 0.5) * range;
      }
      const wobbleX = Math.sin(t * s.wobble + s.phase) * 0.18;
      tmp.position.set(s.x + wobbleX, s.y, s.z);
      tmp.scale.setScalar(s.scale);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshPhysicalMaterial
        color="#fff7d6"
        roughness={0.05}
        metalness={0}
        transmission={0.9}
        thickness={0.3}
        ior={1.33}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={1.4}
        transparent
      />
    </instancedMesh>
  );
}
