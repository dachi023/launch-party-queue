import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Float } from "@react-three/drei";
import * as THREE from "three";

function makeEmojiTexture(emoji: string, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  // soft glow under the glyph to give it dimensionality
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = size * 0.05;
  ctx.shadowOffsetY = size * 0.012;
  ctx.font = `${Math.floor(size * 0.78)}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Props = {
  emoji: string;
  position: [number, number, number];
  scale?: number;
  /** when true, sprite always faces camera; when false, the plane wobbles in 3D */
  billboard?: boolean;
  /** rotation speed (when not billboarded) */
  spin?: number;
  floatSpeed?: number;
  floatIntensity?: number;
};

export function FloatingEmoji({
  emoji,
  position,
  scale = 0.85,
  billboard = false,
  spin = 0.3,
  floatSpeed = 1.3,
  floatIntensity = 1.3,
}: Props) {
  const tex = useMemo(() => makeEmojiTexture(emoji), [emoji]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!billboard && ref.current) ref.current.rotation.z += delta * spin;
  });

  const plane = (
    <mesh ref={ref} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        alphaTest={0.4}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );

  return (
    <Float
      position={position}
      speed={floatSpeed}
      rotationIntensity={billboard ? 0 : 0.25}
      floatIntensity={floatIntensity}
    >
      {billboard ? <Billboard>{plane}</Billboard> : plane}
    </Float>
  );
}
