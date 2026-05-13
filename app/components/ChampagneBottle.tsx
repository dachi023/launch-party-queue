import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  showCork?: boolean;
};

/**
 * Profile for a champagne bottle, sampled as Vec2 points along the y-axis.
 * Lathed around the y-axis to produce the full silhouette in one mesh.
 */
function buildBottleProfile(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  // base punt (slight inward curl, then flat bottom)
  pts.push(new THREE.Vector2(0.0, 0.04));
  pts.push(new THREE.Vector2(0.15, 0.02));
  pts.push(new THREE.Vector2(0.32, 0.0));
  pts.push(new THREE.Vector2(0.42, 0.02));
  pts.push(new THREE.Vector2(0.45, 0.08));
  // straight body
  pts.push(new THREE.Vector2(0.46, 0.2));
  pts.push(new THREE.Vector2(0.46, 1.6));
  // shoulder (smooth curve)
  pts.push(new THREE.Vector2(0.455, 1.72));
  pts.push(new THREE.Vector2(0.43, 1.82));
  pts.push(new THREE.Vector2(0.38, 1.92));
  pts.push(new THREE.Vector2(0.3, 2.0));
  pts.push(new THREE.Vector2(0.22, 2.08));
  // neck
  pts.push(new THREE.Vector2(0.19, 2.16));
  pts.push(new THREE.Vector2(0.18, 2.35));
  pts.push(new THREE.Vector2(0.18, 2.65));
  // lip flare
  pts.push(new THREE.Vector2(0.19, 2.72));
  pts.push(new THREE.Vector2(0.205, 2.76));
  pts.push(new THREE.Vector2(0.205, 2.82));
  pts.push(new THREE.Vector2(0.18, 2.84));
  pts.push(new THREE.Vector2(0.0, 2.84));
  return pts;
}

/* ---------- Foil profile (the metallic cap wrapping the lip) ---------- */
function buildFoilProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 2.84),
    new THREE.Vector2(0.21, 2.84),
    new THREE.Vector2(0.215, 2.78),
    new THREE.Vector2(0.215, 2.48),
    new THREE.Vector2(0.205, 2.46),
    new THREE.Vector2(0.0, 2.46),
  ];
}

function makeLabelTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // background paper
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, "#fbe6b8");
  bg.addColorStop(0.5, "#fcf1d2");
  bg.addColorStop(1, "#fbe6b8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // subtle paper texture (noise)
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = Math.min(255, Math.max(0, img.data[i]! + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1]! + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2]! + n));
  }
  ctx.putImageData(img, 0, 0);

  // ornamental border
  ctx.strokeStyle = "#7a5a1c";
  ctx.lineWidth = 8;
  ctx.strokeRect(70, 70, size - 140, size - 140);
  ctx.lineWidth = 2;
  ctx.strokeRect(96, 96, size - 192, size - 192);

  // top emblem
  ctx.fillStyle = "#caa14a";
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.32, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2810";
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.32, 96, 0, Math.PI * 2);
  ctx.fill();
  // monogram
  ctx.fillStyle = "#caa14a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 130px Georgia, serif";
  ctx.fillText("LPQ", size / 2, size * 0.32 + 6);

  // brand line
  ctx.fillStyle = "#3a2810";
  ctx.font = "600 64px Georgia, serif";
  ctx.fillText("LAUNCH PARTY", size / 2, size * 0.55);
  ctx.font = "600 64px Georgia, serif";
  ctx.fillText("QUEUE", size / 2, size * 0.62);

  // divider rule with diamond
  ctx.strokeStyle = "#caa14a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.22, size * 0.72);
  ctx.lineTo(size * 0.42, size * 0.72);
  ctx.moveTo(size * 0.58, size * 0.72);
  ctx.lineTo(size * 0.78, size * 0.72);
  ctx.stroke();
  ctx.fillStyle = "#caa14a";
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.72 - 8);
  ctx.lineTo(size / 2 + 10, size * 0.72);
  ctx.lineTo(size / 2, size * 0.72 + 8);
  ctx.lineTo(size / 2 - 10, size * 0.72);
  ctx.closePath();
  ctx.fill();

  // tasting note
  ctx.fillStyle = "#3a2810";
  ctx.font = "italic 38px Georgia, serif";
  ctx.fillText("Brut · Cuvée 2026", size / 2, size * 0.78);

  // foot
  ctx.font = "500 28px sans-serif";
  ctx.fillStyle = "#7a5a1c";
  ctx.fillText("PRODUIT DE LA RELEASE  ·  750 ML  ·  12% VOL", size / 2, size * 0.86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

const bottleGeom = (segments = 96) =>
  new THREE.LatheGeometry(buildBottleProfile(), segments);
const foilGeom = (segments = 64) =>
  new THREE.LatheGeometry(buildFoilProfile(), segments);

export const ChampagneBottle = forwardRef<Group, Props>(function ChampagneBottle(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, showCork = true },
  ref
) {
  const bottle = useMemo(() => bottleGeom(), []);
  const foil = useMemo(() => foilGeom(), []);
  const labelTex = useMemo(() => makeLabelTexture(), []);

  // Keep external scale compatible with the old simpler model
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group position={[0, -0.852, 0]} scale={0.6}>
        {/* glass body */}
        <mesh geometry={bottle}>
          <meshPhysicalMaterial
            color="#0c2a17"
            roughness={0.13}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.7}
            ior={1.5}
            transmission={0.05}
            thickness={0.6}
            side={THREE.FrontSide}
          />
        </mesh>
        {/* inner highlight to fake liquid colour */}
        <mesh scale={[0.96, 0.96, 0.96]} geometry={bottle}>
          <meshBasicMaterial color="#062812" side={THREE.BackSide} />
        </mesh>

        {/* foil cap */}
        <mesh geometry={foil}>
          <meshPhysicalMaterial
            color="#d4a542"
            roughness={0.22}
            metalness={0.95}
            clearcoat={0.7}
            clearcoatRoughness={0.12}
            envMapIntensity={1.8}
          />
        </mesh>
        {/* foil bottom rim (thin gold line) */}
        <mesh position={[0, 2.46, 0]}>
          <torusGeometry args={[0.213, 0.012, 16, 64]} />
          <meshPhysicalMaterial
            color="#8a6418"
            roughness={0.35}
            metalness={0.9}
          />
        </mesh>

        {/* wrap-around paper label */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.465, 0.465, 0.78, 96, 1, true]} />
          <meshPhysicalMaterial
            map={labelTex}
            roughness={0.7}
            metalness={0.02}
            clearcoat={0.15}
            clearcoatRoughness={0.5}
            side={THREE.FrontSide}
          />
        </mesh>
        {/* top label trim (thin gold strip) */}
        <mesh position={[0, 1.26, 0]}>
          <cylinderGeometry args={[0.466, 0.466, 0.025, 96, 1, true]} />
          <meshPhysicalMaterial color="#caa14a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.466, 0.466, 0.025, 96, 1, true]} />
          <meshPhysicalMaterial color="#caa14a" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* cork (optional) */}
        {showCork ? (
          <group position={[0, 2.92, 0]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.205, 0.28, 32]} />
              <meshPhysicalMaterial
                color="#b07238"
                roughness={0.85}
                metalness={0.04}
                clearcoat={0.2}
                clearcoatRoughness={0.6}
              />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.21, 0.21, 0.04, 32]} />
              <meshPhysicalMaterial color="#caa14a" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
});
