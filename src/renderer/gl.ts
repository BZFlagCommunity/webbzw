export const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec4 color;
layout(location = 2) in vec3 normal;

out vec4 vColor;

uniform mat4 proj;
uniform mat4 view;
uniform mat4 model;

const vec3 SUN_POSITION_0 = normalize(vec3(0.3, 0.5, 0.8));
const vec3 SUN_POSITION_1 = normalize(vec3(-0.3, 0.5, -0.8));
const vec3 SUN_POSITION_2 = normalize(vec3(0.0, -1.0, 0.0));
const float AMBIENT = 0.3;

float calculateLighting(vec3 sun){
  return max(dot(normalize(normal), sun), 0.0);
}

void main(){
  vColor = vec4(vec3(max(calculateLighting(SUN_POSITION_0) + calculateLighting(SUN_POSITION_1) + (calculateLighting(SUN_POSITION_2) * 0.7), AMBIENT)), 1.0) * color;

  gl_Position = proj * view * model * vec4(position, 1.0);
}`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 vColor;

out vec4 finalColor;

void main(){
  if(vColor.a < .05){
    discard;
  }

  finalColor = vColor;
}`;

export function createShader(gl: WebGL2RenderingContext , vertCode: string, fragCode: string): WebGLProgram | null{
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  if(!vertShader){
    return null;
  }

  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)){
    console.error("Error compiling vertex shader: ", gl.getShaderInfoLog(vertShader));
    gl.deleteShader(vertShader);
    return null;
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  if(!fragShader){
    return null;
  }

  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)){
    console.error("Error compiling fragment shader: ", gl.getShaderInfoLog(fragShader));
    gl.deleteShader(fragShader);
    return null;
  }

  const shader = gl.createProgram();
  if(!shader){
    return null;
  }

  gl.attachShader(shader, vertShader);
  gl.attachShader(shader, fragShader);
  gl.linkProgram(shader);

  return shader;
}
