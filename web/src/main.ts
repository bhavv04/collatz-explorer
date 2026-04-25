import type { ComputeResponse, DataPoint, DensityBucket } from "./types";
import { renderScatter } from "./renderer/canvas";
import { renderDensity } from "./renderer/density";
import { exportPNG, exportCSV } from "./ui/export";

const worker = new Worker(new URL("./worker/collatz.worker.ts", import.meta.url), {
  type: "module",
});

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const status = document.getElementById("status") as HTMLDivElement;

let lastData: DataPoint[] | DensityBucket[] | null = null;
let lastType: "range" | "density" = "range";

function getInputs() {
  const start = parseInt((document.getElementById("input-start") as HTMLInputElement).value);
  const end = parseInt((document.getElementById("input-end") as HTMLInputElement).value);
  const buckets = parseInt((document.getElementById("input-buckets") as HTMLInputElement).value);
  return { start, end, buckets };
}

function setStatus(msg: string) {
  status.textContent = msg;
}

worker.onmessage = (e: MessageEvent<ComputeResponse>) => {
  const { type, data, elapsed } = e.data;
  lastData = data as DataPoint[] | DensityBucket[];
  lastType = type;

  if (type === "range") {
    renderScatter(canvas, data as DataPoint[]);
  } else {
    renderDensity(canvas, data as DensityBucket[]);
  }

  setStatus(`Computed ${data.length.toLocaleString()} points in ${elapsed.toFixed(1)}ms`);
};

document.getElementById("btn-scatter")!.onclick = () => {
  const { start, end } = getInputs();
  if (end - start > 500_000) {
    setStatus("Range too large for scatter — use density view above 500k.");
    return;
  }
  setStatus("Computing...");
  worker.postMessage({ type: "range", start, end });
};

document.getElementById("btn-density")!.onclick = () => {
  const { start, end, buckets } = getInputs();
  setStatus("Computing...");
  worker.postMessage({ type: "density", start, end, buckets });
};

document.getElementById("btn-export-png")!.onclick = () => exportPNG(canvas);
document.getElementById("btn-export-csv")!.onclick = () => {
  if (lastData) exportCSV(lastData, lastType);
};