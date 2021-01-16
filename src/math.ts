/** Get projection matrix */
export function getProjection(angle: number, aspectRatio: number, zMin: number, zMax: number): number[]{
  const ang = Math.tan((angle * .5) * Math.PI / 180);
  return [
    0.5/ang, 0, 0, 0,
    0, 0.5*aspectRatio/ang, 0, 0,
    0, 0, -(zMax+zMin)/(zMax-zMin), -1,
    0, 0, (-2*zMax*zMin)/(zMax-zMin), 0
  ];
}

/** Multiply two matrices together */
export function multiplyMatrices(a: number[], b: number[]): number[]{
  const result = [];

  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
    a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
    a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
    a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  result[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  result[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  result[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  result[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  result[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  result[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  result[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  result[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  result[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  result[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  result[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  result[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  result[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
  result[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
  result[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
  result[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

  return result;
}

/** Multiply array of matrices together */
export function multiplyArrayOfMatrices(matrices: number[][]): number[]{
  let inputMatrix = matrices[0];

  for(let i = 1; i < matrices.length; i++){
    inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
  }

  return inputMatrix;
}

/** X rotation matrix */
export function rotateXMatrix(angle: number): number[]{
  angle *= Math.PI / 180;
  return [
    1,       0,        0,     0,
    0,  Math.cos(angle),  -Math.sin(angle),     0,
    0,  Math.sin(angle),   Math.cos(angle),     0,
    0,       0,        0,     1
  ];
}

/** Y rotation matrix */
export function rotateYMatrix(angle: number): number[]{
  angle *= Math.PI / 180;
  return [
     Math.cos(angle), 0, Math.sin(angle), 0,
     0,               1, 0,               0,
    -Math.sin(angle), 0, Math.cos(angle), 0,
     0,               0, 0,               1
  ];
}

/** Rotate `position` around Y axis by `angle` */
export function rotY(position: number[], angle: number): number[]{
  const s = Math.sin(angle);
  const c = Math.cos(angle);

  let x = 0, z = 0;
  z = position[2] * c - position[0] * s;
  x = position[2] * s + position[0] * c;

  return [x, position[1], z];
}
