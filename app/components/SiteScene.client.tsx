import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, SpotLight } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { BeerBottle } from "./BeerBottle";
import { BeerMug } from "./BeerMug";
import { BokehLights } from "./BokehLights";
import { ChampagneBottle } from "./ChampagneBottle";
import { ChampagneFlute } from "./ChampagneFlute";
import { ConfettiField } from "./ConfettiField";
import { Cork } from "./Cork";
import { Donut } from "./Donut";
import { RisingBubbles } from "./RisingBubbles";
import { ShaderBackdrop } from "./ShaderBackdrop";
import { Skewer } from "./Skewer";
import { Streamers } from "./Streamers";
import { StreamingItem } from "./StreamingItem";
import { Sushi } from "./Sushi";

/* ----------------------- camera ----------------------- */

function CinemaCamera() {
  useFrame(({ camera, pointer }) => {
    const t = performance.now() * 0.00008;
    const tx = Math.sin(t) * 0.6 + pointer.x * 0.4;
    const ty = 0.2 + Math.cos(t * 0.7) * 0.3 + pointer.y * 0.22;
    camera.position.x += (tx - camera.position.x) * 0.035;
    camera.position.y += (ty - camera.position.y) * 0.035;
    camera.lookAt(0, 0, -3);
  });
  return null;
}

/* ----------------------- streaming swarm ----------------------- */

type Pick = () => React.ReactNode;

const SUSHI_VARIANTS = ["salmon", "tuna", "shrimp", "egg"] as const;
const BEER_VARIANTS = ["amber", "green", "clear"] as const;
const DONUT_VARIANTS = ["pink", "chocolate", "matcha"] as const;

function FoodStream({
  count,
  pick,
  range = { x: 22, y: 16, z: 8 },
  speed = 0.4,
  drift = 0.5,
  spin = 0.7,
}: {
  count: number;
  pick: Pick;
  range?: { x: number; y: number; z: number };
  speed?: number;
  drift?: number;
  spin?: number;
}) {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      content: pick(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  return (
    <>
      {items.map((it) => (
        <StreamingItem
          key={it.key}
          range={range}
          speed={speed}
          drift={drift}
          spin={spin}
        >
          {it.content}
        </StreamingItem>
      ))}
    </>
  );
}

/* ----------------------- scene ----------------------- */

export default function SiteScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      camera={{ position: [0, 0.3, 9.5], fov: 56 }}
    >
      <Suspense fallback={null}>
        <ShaderBackdrop />
        <fog attach="fog" args={["#120814", 8, 24]} />

        {/* lights */}
        <ambientLight intensity={0.3} color="#3a2438" />
        <SpotLight position={[3, 5, 4]} intensity={6} angle={0.65} penumbra={0.7} distance={24} color="#ffb35a" attenuation={4} />
        <SpotLight position={[-4, 3, -2]} intensity={4} angle={0.7} penumbra={0.8} distance={24} color="#5b6bff" attenuation={5} />
        <pointLight position={[0, -4, 0.5]} intensity={2.4} color="#ff5c00" distance={14} />
        <pointLight position={[3, 2, 2]} intensity={1.2} color="#fff1d0" distance={10} />
        <pointLight position={[-3, 2, 2]} intensity={1.0} color="#ffd6f1" distance={10} />

        <CinemaCamera />

        {/* ========= Streaming swarm — food & drink raining slowly ========= */}

        {/* sushi: 4 variants picked at random per item */}
        <FoodStream
          count={18}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.35}
          drift={0.5}
          spin={0.6}
          pick={() => {
            const v = SUSHI_VARIANTS[Math.floor(Math.random() * SUSHI_VARIANTS.length)]!;
            const s = 0.85 + Math.random() * 0.5;
            return <Sushi scale={s} variant={v} />;
          }}
        />

        {/* skewers */}
        <FoodStream
          count={14}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.4}
          drift={0.6}
          spin={0.7}
          pick={() => {
            const s = 0.8 + Math.random() * 0.5;
            return <Skewer scale={s} />;
          }}
        />

        {/* donuts */}
        <FoodStream
          count={12}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.42}
          drift={0.5}
          spin={0.8}
          pick={() => {
            const v = DONUT_VARIANTS[Math.floor(Math.random() * DONUT_VARIANTS.length)]!;
            const s = 0.85 + Math.random() * 0.5;
            return <Donut scale={s} variant={v} />;
          }}
        />

        {/* beer mugs */}
        <FoodStream
          count={10}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.32}
          drift={0.4}
          spin={0.45}
          pick={() => {
            const s = 0.85 + Math.random() * 0.45;
            return <BeerMug scale={s} />;
          }}
        />

        {/* beer bottles */}
        <FoodStream
          count={16}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.36}
          drift={0.45}
          spin={0.5}
          pick={() => {
            const v = BEER_VARIANTS[Math.floor(Math.random() * BEER_VARIANTS.length)]!;
            const s = 0.8 + Math.random() * 0.45;
            return <BeerBottle scale={s} variant={v} />;
          }}
        />

        {/* champagne items — fewer & smaller */}
        <FoodStream
          count={6}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.34}
          drift={0.45}
          spin={0.5}
          pick={() => {
            const isFlute = Math.random() < 0.5;
            const s = 0.6 + Math.random() * 0.4;
            return isFlute ? <ChampagneFlute scale={s} /> : <ChampagneBottle scale={s} />;
          }}
        />

        {/* corks tumbling */}
        <FoodStream
          count={20}
          range={{ x: 24, y: 16, z: 9 }}
          speed={0.5}
          drift={0.6}
          spin={1.2}
          pick={() => {
            const s = 0.4 + Math.random() * 0.35;
            return <Cork scale={s} />;
          }}
        />

        {/* ========= atmosphere ========= */}

        <Streamers count={200} range={{ x: 24, y: 16, z: 8 }} />

        <RisingBubbles count={420} range={20} />

        <BokehLights count={340} spread={{ x: 36, y: 20, z: 8 }} origin={{ x: 0, y: 0.3, z: -14 }} />

        <ConfettiField count={300} range={24} speed={0.55} />

        <Environment preset="warehouse" />

        <EffectComposer multisampling={4}>
          <DepthOfField focusDistance={0.014} focalLength={0.05} bokehScale={2.4} height={540} />
          <Bloom intensity={0.85} luminanceThreshold={0.6} luminanceSmoothing={0.5} mipmapBlur />
          <HueSaturation hue={-0.02} saturation={-0.03} />
          <BrightnessContrast brightness={-0.02} contrast={0.12} />
          <ChromaticAberration
            offset={[0.0006, 0.0008]}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.55} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
