export function identity(dim: number): number[][] {
  return Array.from({ length: dim }, (_, i) => Array.from({ length: dim }, (_, j) => (i === j ? 1 : 0)));
}

export function zeros(dim: number): number[] {
  return Array.from({ length: dim }, () => 0);
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export function outerAddInPlace(matrix: number[][], vec: number[]): void {
  for (let i = 0; i < vec.length; i++) {
    for (let j = 0; j < vec.length; j++) {
      matrix[i][j] += vec[i] * vec[j];
    }
  }
}

/**
 * Solves A x = b via Gauss-Jordan elimination with partial pivoting. Used instead of a full matrix
 * inverse: LinUCB only ever needs A^-1 * b (the ridge-regression estimate) and A^-1 * context
 * (for the confidence width), both of which are solves, not an explicit inverse.
 */
export function solve(matrixIn: number[][], vecIn: number[]): number[] {
  const n = vecIn.length;
  const a = matrixIn.map((row) => [...row]);
  const b = [...vecIn];

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivotRow][col])) pivotRow = row;
    }
    [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
    [b[col], b[pivotRow]] = [b[pivotRow], b[col]];

    const pivot = a[col][col];
    if (Math.abs(pivot) < 1e-9) continue; // singular direction — leave as-is, ridge term keeps A well-conditioned in practice

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col] / pivot;
      if (factor === 0) continue;
      for (let k = col; k < n; k++) a[row][k] -= factor * a[col][k];
      b[row] -= factor * b[col];
    }
  }

  return b.map((value, i) => (Math.abs(a[i][i]) < 1e-9 ? 0 : value / a[i][i]));
}
