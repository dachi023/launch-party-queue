import { useEffect, useRef } from "react";

export default function MouseOrb() {
  const orbRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (orbRef.current) {
        orbRef.current.style.left = `${x}px`;
        orbRef.current.style.top = `${y}px`;
      }
    };
    const onLeave = () => {
      if (orbRef.current) orbRef.current.style.opacity = "0";
      if (trailRef.current) trailRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (orbRef.current) orbRef.current.style.opacity = "1";
      if (trailRef.current) trailRef.current.style.opacity = "1";
    };
    const tick = () => {
      tx += (x - tx) * 0.12;
      ty += (y - ty) * 0.12;
      if (trailRef.current) {
        trailRef.current.style.left = `${tx}px`;
        trailRef.current.style.top = `${ty}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={trailRef} className="mouse-trail" aria-hidden />
      <div ref={orbRef} className="mouse-orb" aria-hidden />
    </>
  );
}
