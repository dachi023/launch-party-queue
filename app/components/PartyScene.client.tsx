import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Center,
  Environment,
  Float,
  Sparkles,
  Text3D,
} from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import * as THREE from "three";
import type { Group } from "three";
import { ChampagneBottle } from "./ChampagneBottle";
import { ConfettiField } from "./ConfettiField";

function PoppingBottle() {
  const bottle = useRef<Group>(null);
  const cork = useRef<Group>(null);
  const t0 = useRef<number>(0);
  useEffect(() => {
    t0.current = performance.now();
  }, []);
  useFrame(() => {
    const elapsed = (performance.now() - t0.current) / 1000;
    if (bottle.current) {
      bottle.current.rotation.z = Math.sin(elapsed * 6) * 0.06;
      bottle.current.rotation.y += 0.02;
      bottle.current.position.y =
        -0.4 + Math.sin(elapsed * 5) * 0.04 - Math.min(0.3, elapsed * 0.05);
    }
    if (cork.current) {
      // cork launches upward fast, with side drift and tumble
      const t = Math.max(0, elapsed - 0.1);
      cork.current.position.y = 1.3 + t * 10;
      cork.current.position.x = Math.sin(t * 3) * 0.6;
      cork.current.rotation.x = t * 12;
      cork.current.rotation.z = t * 7;
    }
  });
  return (
    <>
      <group ref={bottle}>
        <ChampagneBottle scale={1.4} showCork={false} />
      </group>
      <group ref={cork}>
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.21, 0.28, 24]} />
          <meshStandardMaterial color="#b45309" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.04, 24]} />
          <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </>
  );
}

function ExplosionBurst() {
  const ref = useRef<THREE.Points>(null);
  const { positions, velocities, colors } = useMemo(() => {
    const N = 500;
    const positions = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const c = new THREE.Color();
    const palette = [
      "#ec4899",
      "#f59e0b",
      "#a855f7",
      "#22d3ee",
      "#10b981",
      "#f43f5e",
      "#facc15",
    ];
    for (let i = 0; i < N; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 1.5;
      positions[i * 3 + 2] = 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 4 + Math.random() * 6;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed + 3;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      c.set(palette[i % palette.length]!);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, velocities, colors };
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      velocities[i * 3 + 1] -= 9.8 * delta;
      arr[i * 3] += velocities[i * 3] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={colors.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </points>
  );
}

export default function PartyScene({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const fadeAt = setTimeout(() => setFading(true), 2200);
    const closeAt = setTimeout(() => onDone(), 3200);
    return () => {
      clearTimeout(fadeAt);
      clearTimeout(closeAt);
    };
  }, [onDone]);

  return (
    <div
      className={
        "fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-1000 " +
        (fading ? "opacity-0" : "opacity-100")
      }
      style={{
        background:
          "radial-gradient(circle at 50% 60%, rgba(236,72,153,0.25), rgba(168,85,247,0.08) 40%, rgba(0,0,0,0) 70%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 6], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <directionalLight position={[-4, 2, -2]} intensity={0.7} color="#f0abfc" />
        <Suspense fallback={null}>
          <PoppingBottle />
          <ExplosionBurst />
          <ConfettiField count={420} range={18} speed={1.5} />
          <Sparkles count={300} scale={[18, 12, 10]} size={6} speed={1.4} color="#fde68a" />
          <Float speed={2} floatIntensity={1.4} rotationIntensity={0.4}>
            <Center position={[0, 2.4, 0]}>
              <Text3D
                font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json"
                size={0.85}
                height={0.18}
                bevelEnabled
                bevelSize={0.025}
                bevelThickness={0.045}
              >
                CHEERS!!
                <meshStandardMaterial
                  color="#facc15"
                  emissive="#f59e0b"
                  emissiveIntensity={1.2}
                  metalness={0.8}
                  roughness={0.15}
                  toneMapped={false}
                />
              </Text3D>
            </Center>
          </Float>
          <Environment preset="sunset" />
          <EffectComposer multisampling={0}>
            <Bloom intensity={1.1} luminanceThreshold={0.55} mipmapBlur />
            <ChromaticAberration offset={[0.0015, 0.002]} radialModulation={false} modulationOffset={0} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
