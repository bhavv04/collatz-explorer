export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface ZoomState {
  viewport: Viewport;
  original: Viewport;
}

export function createZoomState(xMin: number, xMax: number, yMin: number, yMax: number): ZoomState {
  const viewport = { xMin, xMax, yMin, yMax };
  return { viewport, original: { ...viewport } };
}

export function zoomAt(state: ZoomState, cx: number, cy: number, factor: number): ZoomState {
  const { xMin, xMax, yMin, yMax } = state.viewport;

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  // cx, cy are normalized 0-1 positions within the viewport
  const newXRange = xRange * factor;
  const newYRange = yRange * factor;

  return {
    ...state,
    viewport: {
      xMin: cx - (cx - xMin) * factor,
      xMax: cx + (xMax - cx) * factor,
      yMin: cy - (cy - yMin) * factor,
      yMax: cy + (yMax - cy) * factor,
    }
  };
}

export function pan(state: ZoomState, dx: number, dy: number): ZoomState {
  const { xMin, xMax, yMin, yMax } = state.viewport;
  return {
    ...state,
    viewport: {
      xMin: xMin - dx,
      xMax: xMax - dx,
      yMin: yMin - dy,
      yMax: yMax - dy,
    }
  };
}

export function resetZoom(state: ZoomState): ZoomState {
  return { ...state, viewport: { ...state.original } };
}