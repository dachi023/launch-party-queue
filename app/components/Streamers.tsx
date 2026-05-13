import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PALETTE = [
  "#f5d77a",
  "#caa14a",
  "#f4c45c",
  "#ffd699",
  "#ff8a3d",
  "#ff5c66",
  "#ff3da6",
  "#c084fc",
  "#7b9eff",
  "#7be39a",
  "#fbcfe8",
  "#fef3d8",
];

type Seed = {
  x: number;
  y: number;
  z: number;
  vy: number;
  drift: number;
  driftPhase: number;
  spinSpeed: number;
  spinPhase: number;
  axis: THREE.Vector3;
  scale: number;
};

/** Long thin metallic streamers — slow, drifting, behind the main subjects. */
export function Streamers({
  count = 180,
  range = { x: 22, y: 16, z: 8 },
}: {
  count?: number;
  range?: { x: number; y: number; z: number };
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(0.05, 1.1), []);
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(PALETTE[i % PALETTE.length]!);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count]);
  const seeds = useMemo<Seed[]>(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * range.x,
      y: (Math.random() - 0.5) * range.y,
      z: -6 - Math.random() * range.z,
      vy: 0.25 + Math.random() * 0.45,
      drift: 0.2 + Math.random() * 0.5,
      driftPhase: Math.random() * Math.PI * 2,
      spinSpeed: 1.5 + Math.random() * 3,
      spinPhase: Math.random() * Math.PI * 2,
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      scale: 0.7 + Math.random() * 0.7,
    }));
  }, [count, range.x, range.y, range.z]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const tmp = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      tmp.position.set(seeds[i]!.x, seeds[i]!.y, seeds[i]!.z);
      tmp.scale.setScalar(seeds[i]!.scale);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, seeds]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const tmp = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      s.y -= s.vy * delta;
      if (s.y < -range.y / 2) {
        s.y = range.y / 2;
        s.x = (Math.random() - 0.5) * range.x;
        s.z = -6 - Math.random() * range.z;
      }
      const dx = Math.sin(t * 0.5 + s.driftPhase) * s.drift;
      tmp.position.set(s.x + dx, s.y, s.z);
      tmp.quaternion.setFromAxisAngle(s.axis, t * s.spinSpeed + s.spinPhase);
      tmp.scale.setScalar(s.scale);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geom, undefined, count]}>
      <meshPhysicalMaterial
        side={THREE.DoubleSide}
        roughness={0.28}
        metalness={0.85}
        clearcoat={0.55}
        clearcoatRoughness={0.2}
        envMapIntensity={1.4}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}
