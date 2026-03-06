"use client";

import { useEffect, useRef } from "react";

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  driftX: number;
  driftY: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  angle: number;
  opacity: number;
  width: number;
  speed: number;
  phase: number;
}

function createPrng(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildScene(width: number, height: number) {
  const random = createPrng(20061114);
  const nebulaColors = [
    "rgba(138, 43, 226, 0.26)",
    "rgba(75, 0, 130, 0.22)",
    "rgba(0, 191, 255, 0.24)",
    "rgba(65, 105, 225, 0.2)",
    "rgba(255, 20, 147, 0.18)",
    "rgba(147, 112, 219, 0.24)",
  ];

  const nebulas: Nebula[] = Array.from({ length: 8 }, () => ({
    x: random() * width,
    y: random() * height,
    radius: random() * 200 + 150,
    color: nebulaColors[Math.floor(random() * nebulaColors.length)],
    driftX: (random() - 0.5) * 3.6,
    driftY: (random() - 0.5) * 2.8,
  }));

  const stars: Star[] = Array.from({ length: 300 }, () => ({
    x: random() * width,
    y: random() * height,
    size: random() * 2 + 0.5,
    opacity: random() * 0.8 + 0.2,
    twinkleSpeed: random() * 0.9 + 0.25,
    twinklePhase: random() * Math.PI * 2,
  }));

  const meteors: Meteor[] = Array.from({ length: 9 }, () => ({
    x: random() * (width * 0.92) - width * 0.12,
    y: random() * (height * 0.48) - height * 0.14,
    length: random() * 110 + 44,
    angle: (random() * Math.PI) / 6 + Math.PI / 6,
    opacity: random() * 0.28 + 0.38,
    width: random() * 1.6 + 1,
    speed: random() * 240 + 170,
    phase: random() * 6.5,
  }));

  return { nebulas, stars, meteors };
}

function wrapPosition(value: number, min: number, max: number) {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
}

function configureCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, width, height };
}

function drawScene(canvas: HTMLCanvasElement, timestamp: number, scene: ReturnType<typeof buildScene>) {
  const config = configureCanvas(canvas);
  if (!config) return;

  const { ctx, width, height } = config;
  const time = timestamp / 1000;

  const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, "rgba(20, 12, 48, 0.88)");
  baseGradient.addColorStop(0.5, "rgba(9, 16, 42, 0.68)");
  baseGradient.addColorStop(1, "rgba(20, 8, 24, 0.9)");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const { nebulas, stars, meteors } = scene;

  nebulas.forEach((nebula) => {
    const x = wrapPosition(nebula.x + nebula.driftX * time, -nebula.radius, width + nebula.radius);
    const y = wrapPosition(nebula.y + nebula.driftY * time, -nebula.radius, height + nebula.radius);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, nebula.radius);
    gradient.addColorStop(0, nebula.color);
    gradient.addColorStop(0.55, nebula.color.replace(/[\d.]+\)$/, "0.12)"));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - nebula.radius, y - nebula.radius, nebula.radius * 2, nebula.radius * 2);
  });

  stars.forEach((star) => {
    const twinkle = 0.76 + Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.24;
    const opacity = Math.max(0.12, Math.min(1, star.opacity * twinkle));
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();

    if (star.size > 1.55) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${opacity * 0.26})`;
      ctx.fill();
    }
  });

  meteors.forEach((meteor) => {
    const travel = ((time + meteor.phase) * meteor.speed) % (width + height + meteor.length * 2);
    const headX = meteor.x + Math.cos(meteor.angle) * travel;
    const headY = meteor.y + Math.sin(meteor.angle) * travel;
    const tailX = headX - Math.cos(meteor.angle) * meteor.length;
    const tailY = headY - Math.sin(meteor.angle) * meteor.length;
    const gradient = ctx.createLinearGradient(headX, headY, tailX, tailY);
    gradient.addColorStop(0, `rgba(255,255,255,${meteor.opacity})`);
    gradient.addColorStop(0.45, `rgba(200,220,255,${meteor.opacity * 0.68})`);
    gradient.addColorStop(1, "rgba(200,220,255,0)");

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = meteor.width;
    ctx.moveTo(headX, headY);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(headX, headY, meteor.width * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${meteor.opacity * 0.78})`;
    ctx.fill();
  });

  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.22, width / 2, height / 2, height * 0.9);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ReturnType<typeof buildScene> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rebuildScene = () => {
      sceneRef.current = buildScene(window.innerWidth, window.innerHeight);
    };

    rebuildScene();

    let animationFrame = 0;
    const animate = (timestamp: number) => {
      if (sceneRef.current) {
        drawScene(canvas, timestamp, sceneRef.current);
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    window.addEventListener("resize", rebuildScene);

    return () => {
      window.removeEventListener("resize", rebuildScene);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" style={{ background: "rgb(5, 5, 15)" }} />;
}
