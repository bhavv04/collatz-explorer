import type { DataPoint } from "../types";
import { createZoomState, zoomAt, pan, resetZoom, type ZoomState } from "../ui/zoom";

let zoomState: ZoomState | null = null;
let currentData: DataPoint[] = [];
let animFrame: number | null = null;

// Padding constants
const pad = { top: 20, right: 20, bottom: 40, left: 55 };

export function renderScatter(canvas: HTMLCanvasElement, data: DataPoint[]) {
  currentData = data;

  const maxN = Math.max(...data.map(d => d.n));
  const minN = Math.min(...data.map(d => d.n));
  const maxS = Math.max(...data.map(d => d.steps));

  zoomState = createZoomState(minN, maxN, 0, maxS);

  draw(canvas);
  attachInteractions(canvas);
}

function draw(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 1100;
  const H = 500;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + "px";

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  if (!zoomState) return;

  const { xMin, xMax, yMin, yMax } = zoomState.viewport;
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;

  const xScale = (n: number) => pad.left + ((n - xMin) / (xMax - xMin)) * pw;
  const yScale = (s: number) => pad.top + ph - ((s - yMin) / (yMax - yMin)) * ph;

  // Grid lines + Y axis labels
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (ph / 5) * i;
    const val = Math.round(yMax - ((yMax - yMin) / 5) * i);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + pw, y);
    ctx.stroke();
    ctx.fillStyle = "#71717a";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(val.toString(), pad.left - 8, y + 4);
  }

  // X axis labels
  ctx.fillStyle = "#71717a";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  for (let i = 0; i <= 5; i++) {
    const val = Math.round(xMin + ((xMax - xMin) / 5) * i);
    const x = pad.left + (pw / 5) * i;
    ctx.fillText(val.toLocaleString(), x, H - pad.bottom + 16);
  }

  // Axis labels
  ctx.fillText("n", pad.left + pw / 2, H - 4);
  ctx.save();
  ctx.translate(14, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("stopping time", 0, 0);
  ctx.restore();

  // Only render points within viewport
  const visible = currentData.filter(
    d => d.n >= xMin && d.n <= xMax && d.steps >= yMin && d.steps <= yMax
  );

  // Color by stopping time intensity
  const globalMax = Math.max(...currentData.map(d => d.steps));

  for (const d of visible) {
    const intensity = d.steps / globalMax;
    ctx.fillStyle = dotColor(intensity);
    ctx.beginPath();
    ctx.arc(xScale(d.n), yScale(d.steps), 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Zoom indicator
  const isZoomed =
    zoomState.viewport.xMin !== zoomState.original.xMin ||
    zoomState.viewport.xMax !== zoomState.original.xMax;

  if (isZoomed) {
    ctx.fillStyle = "#6366f1";
    ctx.font = "11px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("double-click to reset", W - pad.right, pad.top + 14);
  }

  // Visible count
  ctx.fillStyle = "#52525b";
  ctx.font = "10px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`${visible.length.toLocaleString()} / ${currentData.length.toLocaleString()} points visible`, pad.left, pad.top + 14);
}

function dotColor(t: number): string {
  // low: #4338ca (indigo) → mid: #818cf8 → high: #fbbf24 (amber)
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(67 + s * (129 - 67));
    const g = Math.round(56 + s * (140 - 56));
    const b = Math.round(202 + s * (248 - 202));
    return `rgb(${r},${g},${b})`;
  } else {
    const s = (t - 0.5) * 2;
    const r = Math.round(129 + s * (251 - 129));
    const g = Math.round(140 + s * (191 - 140));
    const b = Math.round(248 + s * (36 - 248));
    return `rgb(${r},${g},${b})`;
  }
}

function attachInteractions(canvas: HTMLCanvasElement) {
  // Clone to remove old listeners
  const fresh = canvas.cloneNode(true) as HTMLCanvasElement;
  canvas.parentNode!.replaceChild(fresh, canvas);

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let lastViewport = zoomState!.viewport;

  function scheduleRedraw() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(() => draw(fresh));
  }

  function canvasToData(cx: number, cy: number) {
    const rect = fresh.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;
    const { xMin, xMax, yMin, yMax } = zoomState!.viewport;

    const nx = xMin + ((cx - pad.left) / pw) * (xMax - xMin);
    const ny = yMax - ((cy - pad.top) / ph) * (yMax - yMin);
    return { nx, ny };
  }

  // Scroll to zoom
  fresh.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = fresh.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const { nx, ny } = canvasToData(cx, cy);
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    zoomState = zoomAt(zoomState!, nx, ny, factor);
    scheduleRedraw();
  }, { passive: false });

  // Drag to pan
  fresh.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    lastViewport = { ...zoomState!.viewport };
    fresh.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const rect = fresh.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pw = W - pad.left - pad.right;
    const ph = H - pad.top - pad.bottom;
    const { xMin, xMax, yMin, yMax } = lastViewport;

    const dx = ((e.clientX - dragStart.x) / pw) * (xMax - xMin);
    const dy = ((e.clientY - dragStart.y) / ph) * (yMax - yMin);

    zoomState = {
      ...zoomState!,
      viewport: {
        xMin: lastViewport.xMin - dx,
        xMax: lastViewport.xMax - dx,
        yMin: lastViewport.yMin + dy,
        yMax: lastViewport.yMax + dy,
      }
    };
    scheduleRedraw();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    fresh.style.cursor = "crosshair";
  });

  // Double click to reset
  fresh.addEventListener("dblclick", () => {
    zoomState = resetZoom(zoomState!);
    scheduleRedraw();
  });

  fresh.style.cursor = "crosshair";
}