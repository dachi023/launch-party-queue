import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Seed = {
  x: number;
  y: number;
  z: number;
  vy: number;
  drift: number;
  driftAxis: number;
  spinSpeed: number;
  spinPhase: number;
  tiltAxis: THREE.Vector3;
  scale: number;
};

function buildSeeds(count: number, range: number): Seed[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * range,
    y: (Math.random() - 0.5) * range,
    z: (Math.random() - 0.5) * range * 0.4,
    vy: 0.5 + Math.random() * 1.2,
    drift: 0.15 + Math.random() * 0.55,
    driftAxis: Math.random() * Math.PI * 2,
    spinSpeed: 2 + Math.random() * 6,
    spinPhase: Math.random() * Math.PI * 2,
    tiltAxis: new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize(),
    scale: 0.7 + Math.random() * 0.7,
  }));
}

type BatchProps = {
  count: number;
  range: number;
  speed: number;
  geometry: THREE.BufferGeometry;
  palette: string[];
  material: React.ReactNode;
};

function ConfettiBatch({
  count,
  range,
  speed,
  geometry,
  palette,
  material,
}: BatchProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => buildSeeds(count, range), [count, range]);
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(palette[i % palette.length]!);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [count, palette]);

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const tmp = new THREE.Object3D();
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      s.y -= s.vy * delta * speed;
      if (s.y < -range / 2) s.y = range / 2;
      const drift = Math.sin(t * 0.6 + s.driftAxis) * s.drift;
      tmp.position.set(
        s.x + Math.cos(s.driftAxis) * drift,
        s.y,
        s.z + Math.sin(s.driftAxis) * drift
      );
      const angle = t * s.spinSpeed + s.spinPhase;
      tmp.quaternion.setFromAxisAngle(s.tiltAxis, angle);
      tmp.scale.setScalar(s.scale);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]}>
      {material}
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

const FOIL_PALETTE = [
  "#f5d77a",
  "#caa14a",
  "#f4c45c",
  "#e2c97d",
  "#cfd4dc",
  "#a8b0bb",
  "#f7b8c8",
  "#ffd7b5",
];

const PAPER_PALETTE = [
  "#ff5c66",
  "#ff8a3d",
  "#ffd699",
  "#fde68a",
  "#c8ff3d",
  "#7be39a",
  "#7ed8ff",
  "#7b9eff",
  "#c084fc",
  "#ff3da6",
];

const PEARL_PALETTE = [
  "#ffffff",
  "#fef3d8",
  "#ffe9f4",
  "#e9f6ff",
  "#f0f0ff",
  "#fff4e0",
];

export function ConfettiField({
  count = 220,
  range = 14,
  speed = 1,
}: {
  count?: number;
  range?: number;
  speed?: number;
}) {
  const strip = useMemo(() => new THREE.PlaneGeometry(0.07, 0.55), []);
  const square = useMemo(() => new THREE.PlaneGeometry(0.2, 0.2), []);
  const disc = useMemo(() => new THREE.CircleGeometry(0.11, 14), []);

  const stripCount = Math.floor(count * 0.45);
  const squareCount = Math.floor(count * 0.35);
  const discCount = count - stripCount - squareCount;

  return (
    <>
      {/* Metallic foil ribbons */}
      <ConfettiBatch
        count={stripCount}
        range={range}
        speed={speed}
        geometry={strip}
        palette={FOIL_PALETTE}
        material={
          <meshPhysicalMaterial
            side={THREE.DoubleSide}
            roughness={0.25}
            metalness={0.92}
            clearcoat={0.55}
            clearcoatRoughness={0.18}
            envMapIntensity={1.6}
          />
        }
      />
      {/* Matte paper squares */}
      <ConfettiBatch
        count={squareCount}
        range={range}
        speed={speed * 0.9}
        geometry={square}
        palette={PAPER_PALETTE}
        material={
          <meshPhysicalMaterial
            side={THREE.DoubleSide}
            roughness={0.7}
            metalness={0.03}
            clearcoat={0.12}
            clearcoatRoughness={0.6}
            sheen={0.4}
            sheenColor={"#ffffff"}
          />
        }
      />
      {/* Pearlescent discs */}
      <ConfettiBatch
        count={discCount}
        range={range}
        speed={speed * 1.1}
        geometry={disc}
        palette={PEARL_PALETTE}
        material={
          <meshPhysicalMaterial
            side={THREE.DoubleSide}
            roughness={0.18}
            metalness={0.3}
            clearcoat={0.9}
            clearcoatRoughness={0.05}
            iridescence={0.7}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[200, 800]}
            envMapIntensity={1.5}
          />
        }
      />
    </>
  );
}
