import init, { compute_range, compute_density } from "engine";
import type { ComputeRequest, ComputeResponse, DataPoint, DensityBucket } from "../types";

let ready = false;

async function setup() {
  await init();
  ready = true;
}

setup();

self.onmessage = async (e: MessageEvent<ComputeRequest>) => {
  if (!ready) await setup();

  const { type, start, end, buckets } = e.data;
  const t0 = performance.now();

  if (type === "range") {
    const raw = compute_range(BigInt(start), BigInt(end));
    const data: DataPoint[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      data.push({ n: Number(raw[i]), steps: Number(raw[i + 1]) });
    }
    const response: ComputeResponse = { type, data, elapsed: performance.now() - t0 };
    self.postMessage(response);

  } else if (type === "density") {
    const raw = compute_density(BigInt(start), BigInt(end), buckets ?? 500);
    const data: DensityBucket[] = [];
    for (let i = 0; i < raw.length; i += 4) {
      data.push({
        midpoint: Number(raw[i]),
        avg: Number(raw[i + 1]),
        max: Number(raw[i + 2]),
        count: Number(raw[i + 3]),
      });
    }
    const response: ComputeResponse = { type, data, elapsed: performance.now() - t0 };
    self.postMessage(response);
  }
};