/**
 * A highly simplified pseudo-PCA for 2D visualization of high-dimensional embeddings.
 * In a real scenario, this would use a proper math library or the backend would provide 2D coords.
 * This function projects N-dimensional vectors into 2D space.
 */
export function reduceTo2D(embeddings: number[][]): { x: number, y: number }[] {
  if (!embeddings || embeddings.length === 0) return [];
  
  // For visual purposes, we'll extract the first two principal components
  // Here we just use a naive approach (e.g. projecting onto first two dimensions or random fixed projection)
  // to avoid needing a heavy math library like ml-pca on the frontend.
  // We'll normalize the points to a [-100, 100] range for easy plotting.
  
  const points = embeddings.map(vec => {
    // Just sum subsets of dimensions to get pseudo-x and pseudo-y
    let xSum = 0;
    let ySum = 0;
    const half = Math.floor(vec.length / 2);
    
    for (let i = 0; i < vec.length; i++) {
      if (i % 2 === 0) {
        xSum += vec[i];
      } else {
        ySum += vec[i];
      }
    }
    
    return { x: xSum, y: ySum };
  });
  
  // Normalize
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  
  return points.map(p => ({
    x: ((p.x - minX) / rangeX) * 200 - 100,
    y: ((p.y - minY) / rangeY) * 200 - 100
  }));
}
