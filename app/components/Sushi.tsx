import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

type Variant = "salmon" | "tuna" | "shrimp" | "egg";
type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  variant?: Variant;
};

/* ============================================================== */
/* Neta textures                                                  */
/* ============================================================== */

function makeSalmonTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#f5805a");
  grad.addColorStop(0.55, "#ee6c46");
  grad.addColorStop(1, "#d2522f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // creamy white fat veins (the iconic salmon marbling)
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const y = 80 + i * 150 + Math.random() * 40;
    ctx.strokeStyle = `rgba(255, 236, 214, ${0.7 + Math.random() * 0.2})`;
    ctx.lineWidth = 18 + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.3,
      y + (Math.random() - 0.5) * 60,
      size * 0.6,
      y + (Math.random() - 0.5) * 60,
      size,
      y + (Math.random() - 0.5) * 40
    );
    ctx.stroke();
    // thin secondary
    ctx.strokeStyle = `rgba(255, 240, 220, ${0.35})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + 22);
    ctx.bezierCurveTo(
      size * 0.3,
      y + 22 + (Math.random() - 0.5) * 30,
      size * 0.6,
      y + 22 + (Math.random() - 0.5) * 30,
      size,
      y + 22
    );
    ctx.stroke();
  }
  // pearl flecks
  ctx.fillStyle = "rgba(255, 248, 230, 0.4)";
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.6, 1.6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

function makeTunaTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#b53224");
  grad.addColorStop(0.6, "#9c2418");
  grad.addColorStop(1, "#7b1a0e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // muscle fibres
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(170, 30, 20, ${0.12 + Math.random() * 0.18})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }
  // a couple of fat streaks
  for (let i = 0; i < 2; i++) {
    const y = 200 + i * 400 + Math.random() * 200;
    ctx.strokeStyle = "rgba(240, 200, 190, 0.18)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 30, size * 0.7, y + 30, size, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

function makeShrimpTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#ffd4b4");
  grad.addColorStop(0.5, "#ffb898");
  grad.addColorStop(1, "#f7967a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // coral red stripes from the shrimp's back
  for (let i = 0; i < 7; i++) {
    const y = (i / 7) * size;
    const g = ctx.createLinearGradient(0, y, 0, y + size / 7);
    g.addColorStop(0, "rgba(208, 60, 50, 0.55)");
    g.addColorStop(0.4, "rgba(208, 60, 50, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, size, size / 7);
  }
  // tail darker
  const grad2 = ctx.createLinearGradient(size, 0, size * 0.7, 0);
  grad2.addColorStop(0, "rgba(160, 32, 22, 0.55)");
  grad2.addColorStop(1, "rgba(160, 32, 22, 0)");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

function makeEggTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#f3c84a");
  grad.addColorStop(1, "#d9a720");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // tamago layer lines
  ctx.strokeStyle = "rgba(160, 110, 30, 0.45)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath();
    const y = (i / 7) * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
  // subtle browning at corners
  const cg = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.6);
  cg.addColorStop(0, "rgba(0,0,0,0)");
  cg.addColorStop(1, "rgba(120, 60, 0, 0.25)");
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

/* ============================================================== */
/* Custom neta geometry — domed top, flat bottom, tapered ends     */
/* ============================================================== */

function buildNetaGeometry(
  width = 1.0,
  depth = 0.58,
  thickness = 0.13
): THREE.BufferGeometry {
  const cols = 28;
  const rows = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // (col, row) -> vertex index (we have an upper grid and a lower grid)
  // Vertex layout:
  //   upper grid: rows 0..rows
  //   lower grid: rows 0..rows
  // Side strip closes the seam at the perimeter.
  const upperIndex = (i: number, j: number) => i * (rows + 1) + j;
  const lowerIndex = (i: number, j: number) =>
    (cols + 1) * (rows + 1) + i * (rows + 1) + j;

  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const u = i / cols;
      const v = j / rows;
      const x = (u - 0.5) * width;
      const z = (v - 0.5) * depth;
      // dome height: cosine bump, tapered to 0 at perimeter
      const fx = x / (width / 2);
      const fz = z / (depth / 2);
      const dist = Math.min(1, Math.sqrt(fx * fx + fz * fz));
      const dome = Math.cos((dist * Math.PI) / 2);
      const y = thickness * dome;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const u = i / cols;
      const v = j / rows;
      const x = (u - 0.5) * width;
      const z = (v - 0.5) * depth;
      // bottom: nearly flat, slight concave (under-curl) at ends
      const fx = x / (width / 2);
      const endCurl = -0.025 * Math.pow(Math.abs(fx), 4);
      positions.push(x, endCurl, z);
      uvs.push(u, v);
    }
  }

  // upper faces
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = upperIndex(i, j);
      const b = upperIndex(i + 1, j);
      const cIdx = upperIndex(i + 1, j + 1);
      const d = upperIndex(i, j + 1);
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }
  // lower faces (reversed winding so normals point down)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = lowerIndex(i, j);
      const b = lowerIndex(i + 1, j);
      const cIdx = lowerIndex(i + 1, j + 1);
      const d = lowerIndex(i, j + 1);
      indices.push(a, cIdx, b, a, d, cIdx);
    }
  }
  // side strip — perimeter
  // top edge (j = rows) front view; we walk the perimeter of the upper grid and stitch to lower
  const stitch = (a: number, b: number, ll: number, lr: number) => {
    indices.push(a, ll, b, b, ll, lr);
  };
  // walk +i along j=0
  for (let i = 0; i < cols; i++) {
    stitch(
      upperIndex(i, 0),
      upperIndex(i + 1, 0),
      lowerIndex(i, 0),
      lowerIndex(i + 1, 0)
    );
  }
  // walk +j along i=cols
  for (let j = 0; j < rows; j++) {
    stitch(
      upperIndex(cols, j),
      upperIndex(cols, j + 1),
      lowerIndex(cols, j),
      lowerIndex(cols, j + 1)
    );
  }
  // walk -i along j=rows
  for (let i = cols; i > 0; i--) {
    stitch(
      upperIndex(i, rows),
      upperIndex(i - 1, rows),
      lowerIndex(i, rows),
      lowerIndex(i - 1, rows)
    );
  }
  // walk -j along i=0
  for (let j = rows; j > 0; j--) {
    stitch(
      upperIndex(0, j),
      upperIndex(0, j - 1),
      lowerIndex(0, j),
      lowerIndex(0, j - 1)
    );
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(positions), 3)
  );
  geom.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Float32Array(uvs), 2)
  );
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/* ============================================================== */
/* Rice — packed instanced capsules along the ellipsoid surface    */
/* ============================================================== */

const RX = 0.42;
const RY = 0.1;
const RZ = 0.28;

function ellipsoidYFromXZ(x: number, z: number, sign = 1): number {
  const fx = x / RX;
  const fz = z / RZ;
  const k = Math.max(0, 1 - fx * fx - fz * fz);
  return sign * RY * Math.sqrt(k);
}

function buildRiceMatrices(): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();
  const grainLen = () => 0.072 + Math.random() * 0.012;
  const grainW = () => 0.024 + Math.random() * 0.005;
  const jit = (amount = 0.013) => (Math.random() - 0.5) * amount;

  // Top dome — staggered grid
  const cols = 15;
  const rows = 9;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const stagger = j % 2 === 0 ? 0 : 0.5;
      const u = (i + stagger + 0.5) / cols - 0.5;
      const v = (j + 0.5) / rows - 0.5;
      const x = u * (RX * 1.92);
      const z = v * (RZ * 1.92);
      if ((x / RX) ** 2 + (z / RZ) ** 2 > 0.99) continue;
      const y = ellipsoidYFromXZ(x, z, 1) + 0.012;
      dummy.position.set(x + jit(), y, z + jit());
      // grains rotate around y so the long axis lies along an arbitrary direction
      const yaw = Math.random() * Math.PI * 2;
      dummy.rotation.set((Math.random() - 0.5) * 0.4, yaw, (Math.random() - 0.5) * 0.25);
      dummy.scale.set(grainLen(), grainW(), grainW());
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
  }
  // Bottom — slightly tighter
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const stagger = j % 2 === 0 ? 0.5 : 0;
      const u = (i + stagger + 0.5) / cols - 0.5;
      const v = (j + 0.5) / rows - 0.5;
      const x = u * (RX * 1.92);
      const z = v * (RZ * 1.92);
      if ((x / RX) ** 2 + (z / RZ) ** 2 > 0.99) continue;
      const y = ellipsoidYFromXZ(x, z, -1) - 0.012;
      dummy.position.set(x + jit(), y, z + jit());
      const yaw = Math.random() * Math.PI * 2;
      dummy.rotation.set((Math.random() - 0.5) * 0.3, yaw, (Math.random() - 0.5) * 0.2);
      dummy.scale.set(grainLen() * 0.92, grainW() * 0.95, grainW() * 0.95);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
  }
  // Side caps (±X) — yz grid
  for (const sign of [-1, 1]) {
    const sideCols = 5;
    const sideRows = 7;
    for (let i = 0; i < sideCols; i++) {
      for (let j = 0; j < sideRows; j++) {
        const u = (i + 0.5) / sideCols - 0.5;
        const v = (j + 0.5) / sideRows - 0.5;
        const y = u * (RY * 1.9);
        const z = v * (RZ * 1.92);
        const inside = (y / RY) ** 2 + (z / RZ) ** 2;
        if (inside > 0.99) continue;
        const xEdge =
          sign *
          RX *
          Math.sqrt(Math.max(0, 1 - (y / RY) ** 2 - (z / RZ) ** 2));
        dummy.position.set(xEdge + sign * 0.014 + jit(0.008), y, z + jit());
        const yaw = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.3,
          yaw,
          (Math.random() - 0.5) * 0.3
        );
        dummy.scale.set(grainLen() * 0.86, grainW() * 0.92, grainW() * 0.92);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
      }
    }
  }
  return matrices;
}

function RiceGrains() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const matrices = useMemo(() => buildRiceMatrices(), []);
  const count = matrices.length;
  useLayoutEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      ref.current.setMatrixAt(i, matrices[i]!);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.5, 1.4, 4, 10]} />
      <meshPhysicalMaterial
        color="#fcf3d5"
        roughness={0.72}
        metalness={0}
        sheen={1}
        sheenColor="#fff7d8"
        clearcoat={0.25}
        clearcoatRoughness={0.4}
        transmission={0.15}
        thickness={0.06}
        ior={1.4}
        attenuationColor="#f1d59c"
        attenuationDistance={0.5}
      />
    </instancedMesh>
  );
}

/* ============================================================== */
/* Component                                                      */
/* ============================================================== */

const NETA_PARAMS: Record<
  Variant,
  {
    color: string;
    emissive: string;
    roughness: number;
    clearcoat: number;
    transmission: number;
    attenuationColor: string;
  }
> = {
  salmon: {
    color: "#ee6e46",
    emissive: "#5a1808",
    roughness: 0.34,
    clearcoat: 0.7,
    transmission: 0.22,
    attenuationColor: "#a83a1c",
  },
  tuna: {
    color: "#9c2418",
    emissive: "#2a0604",
    roughness: 0.42,
    clearcoat: 0.45,
    transmission: 0.15,
    attenuationColor: "#5a1208",
  },
  shrimp: {
    color: "#f7967a",
    emissive: "#5a1810",
    roughness: 0.34,
    clearcoat: 0.65,
    transmission: 0.18,
    attenuationColor: "#9a3018",
  },
  egg: {
    color: "#e4b426",
    emissive: "#6a4a10",
    roughness: 0.55,
    clearcoat: 0.25,
    transmission: 0,
    attenuationColor: "#a87a18",
  },
};

export const Sushi = forwardRef<Group, Props>(function Sushi(
  {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    variant = "salmon",
  },
  ref
) {
  const netaTex = useMemo(() => {
    if (variant === "salmon") return makeSalmonTexture();
    if (variant === "tuna") return makeTunaTexture();
    if (variant === "shrimp") return makeShrimpTexture();
    return makeEggTexture();
  }, [variant]);

  const netaGeom = useMemo(() => buildNetaGeometry(1.0, 0.58, 0.14), []);
  const p = NETA_PARAMS[variant];

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <group scale={0.55}>
        {/* === RICE BASE (fills gaps between grains, same colour) === */}
        <mesh scale={[RX, RY, RZ]}>
          <sphereGeometry args={[1, 36, 28]} />
          <meshPhysicalMaterial
            color="#f7e9c2"
            roughness={0.92}
            metalness={0}
            sheen={0.45}
            sheenColor="#fffae0"
          />
        </mesh>
        <RiceGrains />

        {/* === NETA === */}
        <group position={[0, RY + 0.005, 0]} rotation={[0.04, 0, 0]}>
          <mesh geometry={netaGeom}>
            <meshPhysicalMaterial
              map={netaTex}
              color={p.color}
              emissive={p.emissive}
              emissiveIntensity={0.06}
              roughness={p.roughness}
              metalness={0}
              clearcoat={p.clearcoat}
              clearcoatRoughness={0.16}
              sheen={0.6}
              sheenColor="#ffeedd"
              envMapIntensity={1.5}
              transmission={p.transmission}
              thickness={0.4}
              ior={1.38}
              attenuationColor={p.attenuationColor}
              attenuationDistance={0.55}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* === Nori band (egg) === */}
        {variant === "egg" ? (
          <mesh position={[0, RY + 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.14, 32, 1, true]} />
            <meshPhysicalMaterial
              color="#0f1f10"
              roughness={0.55}
              metalness={0.04}
              clearcoat={0.4}
              clearcoatRoughness={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        ) : null}

        {/* === Salmon roe accent === */}
        {variant === "salmon"
          ? Array.from({ length: 5 }).map((_, i) => (
              <mesh
                key={i}
                position={[
                  -0.32 + (i / 4) * 0.64 + (Math.random() - 0.5) * 0.04,
                  RY + 0.16,
                  (Math.random() - 0.5) * 0.36,
                ]}
              >
                <sphereGeometry args={[0.024, 14, 12]} />
                <meshPhysicalMaterial
                  color="#ff8a3d"
                  emissive="#ff5c00"
                  emissiveIntensity={0.45}
                  roughness={0.2}
                  metalness={0.04}
                  clearcoat={1}
                  transmission={0.3}
                  thickness={0.05}
                  ior={1.4}
                />
              </mesh>
            ))
          : null}
      </group>
    </group>
  );
});
