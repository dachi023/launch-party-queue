import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

function bottleProfile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  // base
  pts.push(new THREE.Vector2(0.0, 0.0));
  pts.push(new THREE.Vector2(0.3, 0.0));
  pts.push(new THREE.Vector2(0.32, 0.04));
  pts.push(new THREE.Vector2(0.32, 1.7));
  // long sloping shoulder
  pts.push(new THREE.Vector2(0.31, 1.78));
  pts.push(new THREE.Vector2(0.28, 1.86));
  pts.push(new THREE.Vector2(0.22, 1.96));
  pts.push(new THREE.Vector2(0.17, 2.08));
  pts.push(new THREE.Vector2(0.14, 2.22));
  // long neck
  pts.push(new THREE.Vector2(0.13, 2.4));
  pts.push(new THREE.Vector2(0.13, 2.95));
  // crown lip
  pts.push(new THREE.Vector2(0.15, 3.0));
  pts.push(new THREE.Vector2(0.155, 3.06));
  pts.push(new THREE.Vector2(0.13, 3.07));
  pts.push(new THREE.Vector2(0.0, 3.07));
  return pts;
}

function makeLabelTexture(brand: string, accent: string, fg: string): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // background paper (slightly aged)
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#fdf3df");
  bg.addColorStop(1, "#f3e1b8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // top and bottom accent bands
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 48);
  ctx.fillRect(0, h - 48, w, 48);

  // emblem (oval)
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 180, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fdf3df";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 168, 78, 0, 0, Math.PI * 2);
  ctx.fill();

  // brand text
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 80px Georgia, serif";
  ctx.fillText(brand, w / 2, h / 2);

  // small text bands
  ctx.font = "italic 26px Georgia, serif";
  ctx.fillText("— since release —", w / 2, h / 2 + 70);
  ctx.font = "600 22px sans-serif";
  ctx.fillStyle = "#5a3c0c";
  ctx.fillText("LARGER · PREMIUM · 5.0% VOL", w / 2, h - 78);
  ctx.fillStyle = "#fdf3df";
  ctx.fillText("EST. 2026", w / 2, 30);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

type Variant = "amber" | "green" | "clear";
const VARIANTS: Record<Variant, {
  glass: string;
  cap: string;
  labelAccent: string;
  labelFg: string;
  brand: string;
}> = {
  amber: {
    glass: "#4a2a14",
    cap: "#d6c14a",
    labelAccent: "#7a3a14",
    labelFg: "#3a2008",
    brand: "RELEASE",
  },
  green: {
    glass: "#163a1c",
    cap: "#c6c6c6",
    labelAccent: "#3a6e2c",
    labelFg: "#1a2a08",
    brand: "QUEUE",
  },
  clear: {
    glass: "#dde9ea",
    cap: "#b07a2c",
    labelAccent: "#3a4a5c",
    labelFg: "#1a2a3a",
    brand: "DEPLOY",
  },
};

export const BeerBottle = forwardRef<Group, Props & { variant?: Variant }>(
  function BeerBottle(
    { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, variant = "amber" },
    ref
  ) {
    const v = VARIANTS[variant];
    const geom = useMemo(() => new THREE.LatheGeometry(bottleProfile(), 80), []);
    const label = useMemo(
      () => makeLabelTexture(v.brand, v.labelAccent, v.labelFg),
      [v.brand, v.labelAccent, v.labelFg]
    );

    return (
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        <group position={[0, -0.92, 0]} scale={0.6}>
          {/* glass body */}
          <mesh geometry={geom}>
            <meshPhysicalMaterial
              color={v.glass}
              roughness={0.16}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.05}
              envMapIntensity={1.6}
              transmission={variant === "clear" ? 0.4 : 0.08}
              thickness={0.6}
              ior={1.5}
              side={THREE.FrontSide}
            />
          </mesh>
          {/* inner deep color to enrich glass */}
          <mesh geometry={geom} scale={[0.96, 0.96, 0.96]}>
            <meshBasicMaterial color={v.glass} side={THREE.BackSide} />
          </mesh>
          {/* crown cap */}
          <mesh position={[0, 3.09, 0]}>
            <cylinderGeometry args={[0.155, 0.155, 0.12, 28]} />
            <meshPhysicalMaterial
              color={v.cap}
              metalness={0.85}
              roughness={0.3}
              clearcoat={0.5}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* fluted crown edge */}
          <mesh position={[0, 3.03, 0]}>
            <torusGeometry args={[0.158, 0.012, 14, 48]} />
            <meshStandardMaterial color="#7a6018" metalness={0.9} roughness={0.4} />
          </mesh>
          {/* paper label */}
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.323, 0.323, 0.85, 80, 1, true]} />
            <meshPhysicalMaterial
              map={label}
              roughness={0.7}
              metalness={0.02}
              clearcoat={0.1}
              clearcoatRoughness={0.55}
              side={THREE.FrontSide}
            />
          </mesh>
          {/* small neck label */}
          <mesh position={[0, 2.55, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.22, 48, 1, true]} />
            <meshPhysicalMaterial
              color={v.labelAccent}
              roughness={0.55}
              metalness={0.08}
              clearcoat={0.2}
            />
          </mesh>
        </group>
      </group>
    );
  }
);
