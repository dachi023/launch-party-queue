import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.05;
    a *= 0.55;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.04;

  // Soft volumetric smoke fbm
  vec2 q = p * 1.0;
  q.x += fbm(q + t) * 0.85;
  q.y += fbm(q - t * 0.7) * 0.85;
  float n = fbm(q + t * 0.6);

  // Deep cinema backdrop — plum → midnight blue
  vec3 base = mix(
    vec3(0.10, 0.05, 0.10),
    vec3(0.04, 0.04, 0.10),
    smoothstep(-0.4, 0.6, p.y)
  );
  base = mix(base * 0.85, base, n);

  // Stage light from below — amber bloom
  float stageGlow = pow(max(0.0, 0.85 - distance(p, vec2(m.x * 0.4, -0.55))), 4.5);
  base += stageGlow * vec3(1.0, 0.55, 0.18) * 0.95;

  // Hero key light from above — warm halo
  float keyGlow = pow(max(0.0, 0.9 - distance(p, vec2(m.x * 0.3, 0.2))), 5.5);
  base += keyGlow * vec3(1.0, 0.78, 0.4) * 0.65;

  // Cool rim from the upper corners
  float rim = pow(max(0.0, 0.95 - distance(p, vec2(0.8, 0.5))), 6.0)
            + pow(max(0.0, 0.95 - distance(p, vec2(-0.8, 0.55))), 6.0);
  base += rim * vec3(0.25, 0.35, 1.0) * 0.45;

  // Smoke streaks
  float streak = smoothstep(0.55, 0.95, fbm(p * 2.5 + vec2(t, -t * 0.5)));
  base += streak * vec3(0.18, 0.12, 0.18) * 0.4;

  // Stage vignette baked in
  base *= smoothstep(1.3, 0.35, length(p * vec2(0.85, 1.0)));

  // Filmic grain
  float g = (hash(uv * uResolution + uTime) - 0.5) * 0.03;
  base += g;

  gl_FragColor = vec4(base, 1.0);
}
`;

export function ShaderBackdrop() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [size.width, size.height]
  );

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
    ref.current.uniforms.uResolution.value.set(size.width, size.height);
    const { pointer } = state;
    ref.current.uniforms.uMouse.value.set(
      pointer.x * 0.5 + 0.5,
      pointer.y * 0.5 + 0.5
    );
  });

  return (
    <mesh frustumCulled={false} renderOrder={-9999}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <shaderMaterial
        ref={ref}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
