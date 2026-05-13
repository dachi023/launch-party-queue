import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/* Outer glass silhouette (lathed) */
function fluteOuterProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.26, 0.0),
    new THREE.Vector2(0.27, 0.012),
    new THREE.Vector2(0.27, 0.022),
    new THREE.Vector2(0.04, 0.035),
    // stem
    new THREE.Vector2(0.028, 0.14),
    new THREE.Vector2(0.025, 0.4),
    new THREE.Vector2(0.025, 0.6),
    // bowl rise
    new THREE.Vector2(0.04, 0.66),
    new THREE.Vector2(0.07, 0.74),
    new THREE.Vector2(0.12, 0.86),
    new THREE.Vector2(0.17, 1.02),
    new THREE.Vector2(0.2, 1.2),
    new THREE.Vector2(0.22, 1.4),
    new THREE.Vector2(0.225, 1.55),
    new THREE.Vector2(0.235, 1.62),
    // top of rim (return back inside)
    new THREE.Vector2(0.22, 1.625),
    new THREE.Vector2(0.21, 1.6),
    new THREE.Vector2(0.19, 1.4),
    new THREE.Vector2(0.17, 1.2),
    new THREE.Vector2(0.14, 1.0),
    new THREE.Vector2(0.1, 0.85),
    new THREE.Vector2(0.05, 0.72),
    new THREE.Vector2(0.0, 0.7),
  ];
}

/* Liquid (inner) profile */
function liquidProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.7),
    new THREE.Vector2(0.04, 0.72),
    new THREE.Vector2(0.07, 0.78),
    new THREE.Vector2(0.1, 0.86),
    new THREE.Vector2(0.13, 0.95),
    new THREE.Vector2(0.16, 1.08),
    new THREE.Vector2(0.18, 1.2),
    new THREE.Vector2(0.195, 1.3),
    new THREE.Vector2(0.0, 1.3),
  ];
}

export const ChampagneFlute = forwardRef<Group, Props>(function ChampagneFlute(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 },
  ref
) {
  const glassGeom = useMemo(
    () => new THREE.LatheGeometry(fluteOuterProfile(), 80),
    []
  );
  const liquidGeom = useMemo(
    () => new THREE.LatheGeometry(liquidProfile(), 64),
    []
  );

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group position={[0, -0.81, 0]}>
        {/* glass */}
        <mesh geometry={glassGeom}>
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.03}
            metalness={0}
            transmission={0.98}
            thickness={0.5}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.7}
            attenuationColor={"#fefae6"}
            attenuationDistance={4}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        {/* liquid */}
        <mesh geometry={liquidGeom}>
          <meshPhysicalMaterial
            color="#f4c45c"
            emissive="#e8a324"
            emissiveIntensity={0.25}
            roughness={0.12}
            metalness={0}
            transmission={0.55}
            thickness={0.3}
            ior={1.34}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* meniscus ring on top of liquid */}
        <mesh position={[0, 1.3, 0]}>
          <torusGeometry args={[0.193, 0.008, 16, 64]} />
          <meshStandardMaterial
            color="#fde68a"
            emissive="#fbbf24"
            emissiveIntensity={0.55}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
});
