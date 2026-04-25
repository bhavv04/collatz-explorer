export interface DataPoint {
  n: number;
  steps: number;
}

export interface DensityBucket {
  midpoint: number;
  avg: number;
  max: number;
  count: number;
}

export interface ComputeRequest {
  type: "range" | "density";
  start: number;
  end: number;
  buckets?: number;
}

export interface ComputeResponse {
  type: "range" | "density";
  data: DataPoint[] | DensityBucket[];
  elapsed: number;
}