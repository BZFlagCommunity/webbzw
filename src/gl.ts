export const VERTEX_SHADER = `
attribute vec3 position;
attribute vec4 color;

varying lowp vec4 vColor;

uniform mat4 proj;
uniform mat4 view;
uniform mat4 model;

void main(void){
  gl_Position = proj * view * model * vec4(position, 1.0);
  vColor = color;
}
`;

export const FRAGMENT_SHADER =`
varying lowp vec4 vColor;

void main(void){
  if(vColor.a < .05){
    discard;
  }

  gl_FragColor = vColor;
}
`;

export const createShader = (gl: WebGLRenderingContext, vertCode: string, fragCode: string): WebGLProgram | null => {
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  if(!vertShader){
    return null;
  }

  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  if(!fragShader){
    return null;
  }

  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  const shader = gl.createProgram();
  if(!shader){
    return null;
  }

  gl.attachShader(shader, vertShader);
  gl.attachShader(shader, fragShader);
  gl.linkProgram(shader);

  return shader;
};
