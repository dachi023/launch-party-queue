import { forwardRef, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

function makeYakitoriTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // caramelised tare
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#bd7d3a");
  grad.addColorStop(0.5, "#a35a1d");
  grad.addColorStop(1, "#7a3f10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // glossy hot spots
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 12 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255, 200, 130, 0.7)");
    g.addColorStop(1, "rgba(255, 200, 130, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // char marks
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 6 + Math.random() * 22;
    const h = 4 + Math.random() * 10;
    ctx.fillStyle = `rgba(30, 12, 6, ${0.55 + Math.random() * 0.35})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // sesame flecks
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(255, 230, 180, ${0.4 + Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2.5, 2.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

function makeNegiTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // base pale yellow-green centre
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "#e6efb0");
  grad.addColorStop(0.65, "#cce088");
  grad.addColorStop(0.95, "#6d8a2c");
  grad.addColorStop(1, "#445e15");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // concentric rings
  ctx.strokeStyle = "rgba(80, 110, 30, 0.35)";
  for (let i = 1; i < 5; i++) {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (i / 6) * (size / 2), 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/** Yakitori — chicken chunks on a wooden skewer */
export const Skewer = forwardRef<Group, Props>(function Skewer(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 },
  ref
) {
  const tex = useMemo(() => makeYakitoriTexture(), []);
  const negiTex = useMemo(() => makeNegiTexture(), []);

  const chunks: Array<{
    x: number;
    sx: number;
    sy: number;
    sz: number;
    rotZ: number;
    rotY: number;
    isNegi?: boolean;
  }> = [
    { x: -0.52, sx: 0.34, sy: 0.32, sz: 0.32, rotZ: 0.06, rotY: 0.4 },
    { x: -0.22, sx: 0.36, sy: 0.34, sz: 0.34, rotZ: -0.08, rotY: -0.3 },
    { x: 0.04, sx: 0.16, sy: 0.2, sz: 0.2, rotZ: 0, rotY: 0, isNegi: true },
    { x: 0.26, sx: 0.35, sy: 0.33, sz: 0.33, rotZ: 0.06, rotY: 0.2 },
    { x: 0.56, sx: 0.32, sy: 0.3, sz: 0.3, rotZ: -0.04, rotY: -0.5 },
  ];

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group scale={0.7}>
        {/* wooden stick — thicker than before */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.026, 0.026, 1.55, 18]} />
          <meshPhysicalMaterial
            color="#c1986a"
            roughness={0.85}
            metalness={0.02}
            clearcoat={0.1}
            sheen={0.2}
            sheenColor="#ffe0b0"
          />
        </mesh>
        {/* sharpened tip */}
        <mesh position={[0.81, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.028, 0.1, 16]} />
          <meshStandardMaterial color="#a17640" roughness={0.85} />
        </mesh>

        {chunks.map((c, i) =>
          c.isNegi ? (
            <group key={i} position={[c.x, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[c.sx, c.sx, c.sy * 0.9, 24]} />
                <meshPhysicalMaterial
                  map={negiTex}
                  roughness={0.5}
                  metalness={0}
                  clearcoat={0.45}
                  clearcoatRoughness={0.25}
                  sheen={0.6}
                  sheenColor="#ffffff"
                  transmission={0.15}
                  thickness={0.1}
                  ior={1.35}
                />
              </mesh>
            </group>
          ) : (
            <group key={i} position={[c.x, 0, 0]} rotation={[0, c.rotY, c.rotZ]}>
              <RoundedBox args={[c.sx, c.sy, c.sz]} radius={0.09} smoothness={5}>
                <meshPhysicalMaterial
                  map={tex}
                  roughness={0.45}
                  metalness={0.05}
                  clearcoat={0.75}
                  clearcoatRoughness={0.2}
                  sheen={0.6}
                  sheenColor="#ffb37a"
                  envMapIntensity={1.3}
                  transmission={0.08}
                  thickness={0.2}
                  ior={1.4}
                  attenuationColor="#6e2b0a"
                  attenuationDistance={0.4}
                />
              </RoundedBox>
            </group>
          )
        )}
      </group>
    </group>
  );
});
