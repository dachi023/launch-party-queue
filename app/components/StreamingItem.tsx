import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/**
 * Wraps any 3D content and continuously streams it down the scene like
 * a confetti or a bubble — slow fall, sinusoidal drift, slow tumble.
 * Wraps at the bottom edge and re-emits from above with a new x/z.
 */
export function StreamingItem({
  range = { x: 18, y: 12, z: 6 },
  speed = 0.45,
  drift = 0.4,
  spin = 0.6,
  children,
}: {
  range?: { x: number; y: number; z: number };
  speed?: number;
  drift?: number;
  spin?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);

  const initial = useMemo(
    () => ({
      x: (Math.random() - 0.5) * range.x,
      y: (Math.random() - 0.5) * range.y,
      z: -1.5 - Math.random() * range.z,
      speed: speed * (0.7 + Math.random() * 0.7),
      drift: drift * (0.5 + Math.random() * 0.9),
      phase: Math.random() * Math.PI * 2,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      spinX: (Math.random() - 0.5) * spin,
      spinY: (Math.random() - 0.5) * spin,
      spinZ: (Math.random() - 0.5) * spin,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const state = useRef({
    x: initial.x,
    y: initial.y,
    z: initial.z,
    rx: initial.rotX,
    ry: initial.rotY,
    rz: initial.rotZ,
  });

  useFrame((env, dt) => {
    const s = state.current;
    s.y -= initial.speed * dt;
    if (s.y < -range.y / 2 - 1) {
      s.y = range.y / 2 + 1;
      s.x = (Math.random() - 0.5) * range.x;
      s.z = -1.5 - Math.random() * range.z;
    }
    const t = env.clock.elapsedTime;
    const dx = Math.sin(t * 0.4 + initial.phase) * initial.drift;
    s.rx += initial.spinX * dt;
    s.ry += initial.spinY * dt;
    s.rz += initial.spinZ * dt;
    if (ref.current) {
      ref.current.position.set(s.x + dx, s.y, s.z);
      ref.current.rotation.set(s.rx, s.ry, s.rz);
    }
  });

  return <group ref={ref}>{children}</group>;
}
