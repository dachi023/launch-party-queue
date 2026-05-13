import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Variant = "pink" | "chocolate" | "matcha";
type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  variant?: Variant;
};

const ICING: Record<
  Variant,
  { dough: string; icing: string; drip: string; sprinkles: string[] }
> = {
  pink: {
    dough: "#c79667",
    icing: "#f49ab9",
    drip: "#e87aa1",
    sprinkles: ["#ffffff", "#facc15", "#ff5c66", "#a78bfa", "#22d3ee"],
  },
  chocolate: {
    dough: "#a87544",
    icing: "#3a1d10",
    drip: "#2a140a",
    sprinkles: ["#ffffff", "#fbe39a", "#ff8a3d", "#7be39a"],
  },
  matcha: {
    dough: "#c79667",
    icing: "#7d9636",
    drip: "#62792a",
    sprinkles: ["#ffffff", "#f4c45c", "#ff8a3d", "#ff3da6"],
  },
};

function makeDoughTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // base dough color
  ctx.fillStyle = "#c79667";
  ctx.fillRect(0, 0, size, size);
  // mottle
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 4;
    ctx.fillStyle =
      Math.random() < 0.55
        ? `rgba(168, 117, 64, ${0.18 + Math.random() * 0.2})`
        : `rgba(240, 200, 150, ${0.25 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export const Donut = forwardRef<Group, Props>(function Donut(
  {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    variant = "pink",
  },
  ref
) {
  const v = ICING[variant];
  const doughTex = useMemo(() => makeDoughTexture(), []);

  const sprinkles = useMemo(() => {
    return Array.from({ length: 24 }, () => {
      const a = Math.random() * Math.PI * 2;
      const rr = 0.28 + (Math.random() - 0.5) * 0.08;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const y = 0.14 + Math.random() * 0.01;
      const rot: [number, number, number] = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ];
      return {
        pos: [x, y, z] as [number, number, number],
        rot,
        color: v.sprinkles[Math.floor(Math.random() * v.sprinkles.length)]!,
        len: 0.04 + Math.random() * 0.02,
      };
    });
  }, [v.sprinkles]);


  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group scale={0.65}>
        {/* dough */}
        <mesh>
          <torusGeometry args={[0.3, 0.14, 32, 64]} />
          <meshPhysicalMaterial
            map={doughTex}
            color={v.dough}
            roughness={0.62}
            metalness={0.02}
            clearcoat={0.18}
            clearcoatRoughness={0.5}
            sheen={0.45}
            sheenColor="#fff0d6"
          />
        </mesh>
        {/* icing on top half */}
        <mesh position={[0, 0.04, 0]} scale={[1.005, 0.58, 1.005]}>
          <torusGeometry args={[0.302, 0.142, 32, 64]} />
          <meshPhysicalMaterial
            color={v.icing}
            roughness={0.3}
            metalness={0.05}
            clearcoat={0.85}
            clearcoatRoughness={0.12}
            sheen={0.6}
            sheenColor="#ffffff"
            emissive={v.icing}
            emissiveIntensity={0.04}
          />
        </mesh>
        {/* sprinkles — short rounded pills sitting on the icing */}
        {sprinkles.map((s, i) => (
          <mesh key={i} position={s.pos} rotation={s.rot}>
            <capsuleGeometry args={[0.016, 0.05, 8, 12]} />
            <meshPhysicalMaterial
              color={s.color}
              roughness={0.32}
              metalness={0.05}
              clearcoat={0.6}
              clearcoatRoughness={0.18}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
});
