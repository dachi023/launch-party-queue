import confetti from "canvas-confetti";

export function fireConfetti() {
  const duration = 1800;
  const end = Date.now() + duration;
  const colors = ["#ec4899", "#f59e0b", "#a855f7", "#10b981", "#3b82f6"];

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.8 },
      colors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.8 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 140,
    spread: 100,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.6 },
    colors,
    scalar: 1.1,
  });
}

export function popCrackerSound() {
  if (typeof window === "undefined") return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  // POP: short noise burst with quick decay
  const bufferSize = ctx.sampleRate * 0.25;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1200;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.2);

  // BOOM: low sine drop
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.35, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);

  setTimeout(() => ctx.close().catch(() => {}), 600);
}

async function mount3DPartyScene() {
  if (typeof window === "undefined") return;
  const [{ createRoot }, react, sceneMod] = await Promise.all([
    import("react-dom/client"),
    import("react"),
    import("~/components/PartyScene.client"),
  ]);
  const PartyScene = sceneMod.default;
  const container = document.createElement("div");
  container.dataset.partyScene = "true";
  document.body.appendChild(container);
  const root = createRoot(container);
  const cleanup = () => {
    try {
      root.unmount();
    } catch {}
    container.remove();
  };
  root.render(react.createElement(PartyScene, { onDone: cleanup }));
}

export function fireParty() {
  fireConfetti();
  popCrackerSound();
  void mount3DPartyScene();
}
