use wasm_bindgen::prelude::*;

// Single number: returns stopping time (steps to reach 1)
// Returns 0 if n == 1, u32::MAX as sentinel for overflow guard
#[wasm_bindgen]
pub fn stopping_time(mut n: u64) -> u32 {
    if n == 0 {
        return 0;
    }
    let mut steps: u32 = 0;
    while n != 1 {
        if n % 2 == 0 {
            n /= 2;
        } else {
            n = 3 * n + 1;
        }
        steps += 1;
        // Overflow guard — no known number below 2^64 needs this
        // but keeps the engine safe for arbitrary input
        if steps > 100_000 {
            return u32::MAX;
        }
    }
    steps
}

// Range compute — returns a flat Float64Array to JS
// Format: [n, stopping_time, n, stopping_time, ...]
// Using f64 because JS TypedArrays handle f64 natively
// and u64 would lose precision past Number.MAX_SAFE_INTEGER
#[wasm_bindgen]
pub fn compute_range(start: u64, end: u64) -> Vec<f64> {
    let count = (end.saturating_sub(start) + 1) as usize;
    let mut result = Vec::with_capacity(count * 2);

    for n in start..=end {
        result.push(n as f64);
        result.push(stopping_time(n) as f64);
    }

    result
}

// Density buckets — splits a range into `buckets` bins
// Returns [bucket_midpoint, avg_stopping_time, max_stopping_time, count, ...]
// Used for the heatmap/density view when rendering millions of points
#[wasm_bindgen]
pub fn compute_density(start: u64, end: u64, buckets: u32) -> Vec<f64> {
    let buckets = buckets as usize;
    let range = end.saturating_sub(start) + 1;
    let bucket_size = (range as f64 / buckets as f64).ceil() as u64;

    let mut result = Vec::with_capacity(buckets * 4);

    for i in 0..buckets {
        let b_start = start + (i as u64 * bucket_size);
        let b_end = (b_start + bucket_size - 1).min(end);

        if b_start > end {
            break;
        }

        let mut sum: u64 = 0;
        let mut max: u32 = 0;
        let mut count: u64 = 0;

        for n in b_start..=b_end {
            let s = stopping_time(n);
            sum += s as u64;
            if s > max {
                max = s;
            }
            count += 1;
        }

        let midpoint = (b_start + b_end) as f64 / 2.0;
        let avg = if count > 0 { sum as f64 / count as f64 } else { 0.0 };

        result.push(midpoint);
        result.push(avg);
        result.push(max as f64);
        result.push(count as f64);
    }

    result
}

// Expose a build info string — useful for debugging from JS
#[wasm_bindgen]
pub fn version() -> String {
    format!("collatz-engine v{}", env!("CARGO_PKG_VERSION"))
}