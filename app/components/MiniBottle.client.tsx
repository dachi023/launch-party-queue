import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { Group } from "three";
import { ChampagneBottle } from "./ChampagneBottle";

function Spinner() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.9;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={1.0}>
      <group ref={ref}>
        <ChampagneBottle scale={0.85} />
      </group>
    </Float>
  );
}

export default function MiniBottle() {
  return (
    <Canvas
      dpr={[1, 1.4]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 3.6], fov: 32 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={1.5} />
      <directionalLight position={[-3, -1, -2]} intensity={0.4} color="#f472b6" />
      <Spinner />
      <Sparkles count={40} scale={[3, 4, 3]} size={3.2} speed={0.4} color="#fde68a" />
      <Environment preset="sunset" />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.1} luminanceThreshold={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
