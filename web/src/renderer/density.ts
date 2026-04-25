import type { DensityBucket } from "../types";

export function renderDensity(canvas: HTMLCanvasElement, data: DensityBucket[]) {
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

  const maxAvg = Math.max(...data.map(d => d.avg));
  const maxMid = Math.max(...data.map(d => d.midpoint));
  const minMid = Math.min(...data.map(d => d.midpoint));

  const xScale = (m: number) => pad.left + ((m - minMid) / (maxMid - minMid)) * pw;
  const yScale = (a: number) => pad.top + ph - (a / maxAvg) * ph;
  const barW = Math.max(1, pw / data.length);

  // Grid
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
    ctx.fillText(Math.round(maxAvg - (maxAvg / 5) * i).toString(), pad.left - 8, y + 4);
  }

  // Bars coloured by avg stopping time intensity
  for (const d of data) {
    const x = xScale(d.midpoint);
    const y = yScale(d.avg);
    const intensity = d.avg / maxAvg;
    ctx.fillStyle = interpolateColor(intensity);
    ctx.fillRect(x, y, barW, pad.top + ph - y);
  }

  // Labels
  ctx.fillStyle = "#71717a";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("n (bucketed)", pad.left + pw / 2, H - 4);
  ctx.save();
  ctx.translate(14, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("avg stopping time", 0, 0);
  ctx.restore();
}

function interpolateColor(t: number): string {
  // low: #1e1b4b → high: #818cf8
  const r = Math.round(30 + t * (129 - 30));
  const g = Math.round(27 + t * (140 - 27));
  const b = Math.round(75 + t * (248 - 75));
  return `rgb(${r},${g},${b})`;
}