import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/**
 * Closed mug cross-section, lathed around y.
 * Walks: bottom outside → outer wall → rim top → inner wall → inner bottom → centre.
 */
function mugProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.36, 0.04),
    new THREE.Vector2(0.37, 0.1),
    new THREE.Vector2(0.39, 0.85),
    new THREE.Vector2(0.37, 1.55),
    new THREE.Vector2(0.39, 1.62),
    new THREE.Vector2(0.39, 1.66),
    new THREE.Vector2(0.34, 1.66),
    new THREE.Vector2(0.34, 1.6),
    new THREE.Vector2(0.33, 1.55),
    new THREE.Vector2(0.32, 0.85),
    new THREE.Vector2(0.32, 0.18),
    new THREE.Vector2(0.3, 0.12),
    new THREE.Vector2(0.27, 0.1),
    new THREE.Vector2(0.0, 0.1),
  ];
}

function beerProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.11),
    new THREE.Vector2(0.28, 0.11),
    new THREE.Vector2(0.3, 0.2),
    new THREE.Vector2(0.31, 0.85),
    new THREE.Vector2(0.32, 1.42),
    new THREE.Vector2(0.0, 1.42),
  ];
}

function FoamCluster() {
  const ref = useRef<THREE.InstancedMesh>(null);
  // 3 layers of bubbles → fluffy, marshmallow-like crown
  const LAYERS = useMemo(
    () => [
      // micro layer — extremely fine bubbles filling every gap
      { count: 1800, sizeMin: 0.006, sizeMax: 0.011, domeHeight: 0.04, baseY: 1.43, jitterY: 0.015, radiusMax: 0.31 },
      // dense fine base
      { count: 1000, sizeMin: 0.01, sizeMax: 0.016, domeHeight: 0.06, baseY: 1.445, jitterY: 0.02, radiusMax: 0.305 },
      // middle puffy
      { count: 540, sizeMin: 0.014, sizeMax: 0.022, domeHeight: 0.12, baseY: 1.46, jitterY: 0.03, radiusMax: 0.3 },
      // upper airy crown
      { count: 260, sizeMin: 0.018, sizeMax: 0.03, domeHeight: 0.2, baseY: 1.49, jitterY: 0.045, radiusMax: 0.27 },
    ],
    []
  );
  const N = useMemo(() => LAYERS.reduce((acc, l) => acc + l.count, 0), [LAYERS]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const tmp = new THREE.Object3D();
    let idx = 0;
    for (const layer of LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * layer.radiusMax;
        const tCenter = 1 - r / layer.radiusMax;
        // each upper layer puffs more toward the centre
        const y =
          layer.baseY +
          tCenter * layer.domeHeight +
          (Math.random() - 0.5) * layer.jitterY;
        tmp.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        const s = layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin);
        tmp.scale.setScalar(s);
        tmp.rotation.set(Math.random(), Math.random(), Math.random());
        tmp.updateMatrix();
        ref.current.setMatrixAt(idx, tmp.matrix);
        idx++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [LAYERS]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshPhysicalMaterial
        color="#fffaef"
        roughness={0.45}
        metalness={0}
        transmission={0.18}
        thickness={0.06}
        ior={1.33}
        clearcoat={0.7}
        clearcoatRoughness={0.3}
        sheen={1}
        sheenColor="#ffffff"
        envMapIntensity={1.2}
        attenuationColor="#fff7d8"
        attenuationDistance={2}
      />
    </instancedMesh>
  );
}

export const BeerMug = forwardRef<Group, Props>(function BeerMug(
  { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 },
  ref
) {
  const mugGeom = useMemo(
    () => new THREE.LatheGeometry(mugProfile(), 80),
    []
  );
  const beerGeom = useMemo(
    () => new THREE.LatheGeometry(beerProfile(), 64),
    []
  );

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group position={[0, -0.55, 0]} scale={0.7}>
        {/* glass mug body — single closed lathe */}
        <mesh geometry={mugGeom}>
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
            transmission={0.96}
            thickness={0.4}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
            attenuationColor="#fff4cc"
            attenuationDistance={6}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>

        {/* beer inside — opaque amber, lit so it glows through the glass */}
        <mesh geometry={beerGeom}>
          <meshPhysicalMaterial
            color="#f3a91a"
            emissive="#d18414"
            emissiveIntensity={0.55}
            roughness={0.25}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.08}
            sheen={0.4}
            sheenColor="#ffd86b"
            envMapIntensity={1.3}
          />
        </mesh>
        {/* darker bottom shadow inside the beer */}
        <mesh geometry={beerGeom} scale={[1.001, 0.45, 1.001]} position={[0, 0.0, 0]}>
          <meshBasicMaterial color="#a86604" transparent opacity={0.45} />
        </mesh>

        {/* opaque foam base — hides the beer surface entirely */}
        <mesh position={[0, 1.428, 0]}>
          <cylinderGeometry args={[0.31, 0.31, 0.04, 48]} />
          <meshPhysicalMaterial
            color="#fbf2cf"
            roughness={0.85}
            metalness={0}
            sheen={0.6}
            sheenColor="#ffffff"
            clearcoat={0.3}
          />
        </mesh>

        {/* handle — D-shaped half torus on the right */}
        <mesh
          position={[0.4, 0.88, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <torusGeometry args={[0.32, 0.05, 18, 36, Math.PI]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.06}
            metalness={0}
            transmission={0.94}
            thickness={0.3}
            ior={1.5}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.5}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>

        <FoamCluster />
      </group>
    </group>
  );
});
