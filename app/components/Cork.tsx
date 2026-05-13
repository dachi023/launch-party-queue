import { forwardRef } from "react";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/** A champagne cork: body + flared cap + foil ring */
export const Cork = forwardRef<Group, Props>(function Cork(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 },
  ref
) {
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {/* body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.32, 32]} />
        <meshPhysicalMaterial
          color="#b07238"
          roughness={0.85}
          metalness={0.05}
          clearcoat={0.2}
          clearcoatRoughness={0.6}
        />
      </mesh>
      {/* flared cap */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.12, 32]} />
        <meshPhysicalMaterial
          color="#b07238"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      {/* foil collar */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.06, 32]} />
        <meshPhysicalMaterial
          color="#d4a542"
          roughness={0.2}
          metalness={0.85}
          clearcoat={0.6}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* wire cage hint */}
      <mesh position={[0, -0.17, 0]}>
        <torusGeometry args={[0.19, 0.012, 12, 32]} />
        <meshStandardMaterial color="#8a6418" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
});
