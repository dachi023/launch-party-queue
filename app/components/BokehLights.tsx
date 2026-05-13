import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PALETTE = [
  "#ff8a3d",
  "#ffb673",
  "#ffd699",
  "#ff5c66",
  "#ff3da6",
  "#c084fc",
  "#7b9eff",
  "#3a5cff",
  "#fde68a",
  "#fff0c2",
];

/**
 * A field of soft round emissive discs behind the hero subject.
 * They drift slowly and form the painterly bokeh foundation of the scene.
 */
export function BokehLights({
  count = 220,
  spread = { x: 24, y: 14, z: 6 },
  origin = { x: 0, y: 0.5, z: -14 },
}: {
  count?: number;
  spread?: { x: number; y: number; z: number };
  origin?: { x: number; y: number; z: number };
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.65)");
    grad.addColorStop(0.75, "rgba(255,255,255,0.12)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

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

  const seeds = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: origin.x + (Math.random() - 0.5) * spread.x,
      y: origin.y + (Math.random() - 0.5) * spread.y,
      z: origin.z + (Math.random() - 0.5) * spread.z,
      scale: 0.5 + Math.random() * 1.8,
      drift: 0.05 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, origin.x, origin.y, origin.z, spread.x, spread.y, spread.z]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const tmp = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const s = seeds[i]!;
      const y = s.y + Math.sin(t * s.drift + s.phase) * 0.6;
      const x = s.x + Math.cos(t * s.drift * 0.8 + s.phase) * 0.6;
      tmp.position.set(x, y, s.z);
      tmp.scale.setScalar(s.scale);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}
