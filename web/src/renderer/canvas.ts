import type { DataPoint } from "../types";

export function renderScatter(canvas: HTMLCanvasElement, data: DataPoint[]) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 1100;
  const H = 500;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + "px";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { top: 20, right: 20, bottom: 40, left: 55 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;

  const maxN = Math.max(...data.map(d => d.n));
  const maxS = Math.max(...data.map(d => d.steps));
  const minN = Math.min(...data.map(d => d.n));

  const xScale = (n: number) => pad.left + ((n - minN) / (maxN - minN)) * pw;
  const yScale = (s: number) => pad.top + ph - (s / maxS) * ph;

  // Grid lines
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (ph / 5) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pw, y);
    ctx.stroke();
    ctx.fillStyle = "#71717a";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxS - (maxS / 5) * i).toString(), pad.left - 8, y + 4);
  }

  // Axes labels
  ctx.fillStyle = "#71717a";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("n", pad.left + pw / 2, H - 4);
  ctx.save();
  ctx.translate(14, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("stopping time", 0, 0);
  ctx.restore();

  // Dots
  ctx.fillStyle = "#818cf8";
  for (const d of data) {
    ctx.beginPath();
    ctx.arc(xScale(d.n), yScale(d.steps), 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}