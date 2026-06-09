/**
 * Interpolates between colors to create a viridis-like colormap for the heatmap.
 * @param value A number between 0 and 1
 * @returns An RGB hex string
 */
export function getViridisColor(value: number): string {
  // Clamp value
  value = Math.max(0, Math.min(1, value));
  
  // Custom viridis-style gradient stops based on user request:
  // #0d0d2b (near-zero) to #3b82f6 (medium) to #06b6d4 (high attention)
  
  const stops = [
    { pos: 0.0, r: 13, g: 13, b: 43 },      // #0d0d2b
    { pos: 0.5, r: 59, g: 130, b: 246 },    // #3b82f6
    { pos: 1.0, r: 6, g: 182, b: 212 }      // #06b6d4
  ];
  
  let lower = stops[0];
  let upper = stops[1];
  
  if (value > 0.5) {
    lower = stops[1];
    upper = stops[2];
  }
  
  // Normalize value between lower and upper
  const range = upper.pos - lower.pos;
  const normalizedValue = range === 0 ? 0 : (value - lower.pos) / range;
  
  const r = Math.round(lower.r + (upper.r - lower.r) * normalizedValue);
  const g = Math.round(lower.g + (upper.g - lower.g) * normalizedValue);
  const b = Math.round(lower.b + (upper.b - lower.b) * normalizedValue);
  
  return `rgb(${r}, ${g}, ${b})`;
}
