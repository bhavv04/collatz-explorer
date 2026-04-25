import type { DataPoint, DensityBucket } from "../types";

export function exportPNG(canvas: HTMLCanvasElement) {
  const link = document.createElement("a");
  link.download = `collatz-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function exportCSV(data: DataPoint[] | DensityBucket[], type: "range" | "density") {
  let csv = "";

  if (type === "range") {
    csv = "n,stopping_time\n";
    for (const d of data as DataPoint[]) {
      csv += `${d.n},${d.steps}\n`;
    }
  } else {
    csv = "midpoint,avg_stopping_time,max_stopping_time,count\n";
    for (const d of data as DensityBucket[]) {
      csv += `${d.midpoint},${d.avg.toFixed(2)},${d.max},${d.count}\n`;
    }
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.download = `collatz-${type}-${Date.now()}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
}