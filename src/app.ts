//#region MATH

const getProjection = (angle: number, a: number, zMin: number, zMax: number): number[] => {
  const ang = Math.tan((angle * .5) * Math.PI / 180);
  return [
    0.5/ang, 0, 0, 0,
    0, 0.5*a/ang, 0, 0,
    0, 0, -(zMax+zMin)/(zMax-zMin), -1,
    0, 0, (-2*zMax*zMin)/(zMax-zMin), 0
  ];
};

const multiplyMatrices = (a: number[], b: number[]): number[] => {
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
};

const multiplyArrayOfMatrices = (matrices: number[][]): number[] => {
  let inputMatrix = matrices[0];

  for(let i = 1; i < matrices.length; i++){
    inputMatrix = multiplyMatrices(inputMatrix, matrices[i]);
  }

  return inputMatrix;
};

const rotateXMatrix = (a: number): number[] => {
  a *= Math.PI / 180;
  return [
       1,       0,        0,     0,
       0,  Math.cos(a),  -Math.sin(a),     0,
       0,  Math.sin(a),   Math.cos(a),     0,
       0,       0,        0,     1
  ];
};

const rotateYMatrix = (a: number): number[] => {
  a *= Math.PI / 180;
  return [
     Math.cos(a),   0, Math.sin(a),   0,
          0,   1,      0,   0,
    -Math.sin(a),   0, Math.cos(a),   0,
          0,   0,      0,   1
  ];
};

const rotY = (a: number[], angle: number): number[] => {
  const s = Math.sin(angle);
  const c = Math.cos(angle);

  let x = 0, z = 0;
  z = a[2] * c - a[0] * s;
  x = a[2] * s + a[0] * c;

  return [x, a[1], z];
};

//#endregion

//#region GL

const VERTEX_SHADER = `
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

const FRAGMENT_SHADER =`
varying lowp vec4 vColor;

void main(void){
  if(vColor.a < .05){
    discard;
  }

  gl_FragColor = vColor;
}
`;

const createShader = (gl: WebGLRenderingContext, vertCode: string, fragCode: string): WebGLProgram | null => {
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

//#endregion

const textarea = document.querySelector(".editor textarea") as HTMLTextAreaElement;
const editor = document.querySelector(".editor") as HTMLDivElement;
const canvas = document.querySelector("canvas");
const autoRotate = document.querySelector("#auto-rotate") as HTMLInputElement;

const viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-300,1];
const modelMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

const MOUSE_SPEED = 75;

let source = localStorage.getItem("bzw") || `# sample world\n\nworld\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend`;
textarea.value = source;
setTimeout(runHighlighter);

let vbo: WebGLBuffer, cbo: WebGLBuffer, ebo: WebGLBuffer;
let elementCount = 0;

enum MapObjectType{
  NONE = "",
  BOX = "box",
  PYRAMID = "pyramid",
  BASE = "base"
}

interface IMapObject{
  type: MapObjectType;
  position: number[];
  shift: number[];
  scale: number[];
  rotation: number;
  color?: number[];
}

const map: {
  worldSize: number,
  objects: IMapObject[]
} = {
  worldSize: 400,
  objects: []
};

const HIGHLIGHT_HEADERS = [
  "world",
  "options",
  "waterLevel",
  "dynamicColor",
  "textureMatrix",
  "material",
  "transform",
  "physics",
  "arc",
  "base",
  "box",
  "cone",
  "define",
  "group",
  "link",
  "mesh",
  "meshbox",
  "meshpyr",
  "pyramid",
  "sphere",
  "teleporter",
  "tetra",
  "weapon",
  "zone",
  "face",
  "endface",
  "enddef",
  "drawInfo",
  "lod",
  "end"
];
const HIGHLIGHT_HEADERS_REGEX = new RegExp(`^(${HIGHLIGHT_HEADERS.join("|")})`, "gm");

const HIGHLIGHT_KEYWORDS = [
  "position",
  "size",
  "shift",
  "rotation",
  "color",
  "name",
  "flagHeight"
];
const HIGHLIGHT_KEYWORDS_REGEX = new RegExp(`(^\\s*${HIGHLIGHT_KEYWORDS.join("|")})`, "gm");

const highlightSpan = (type: string): string => `<span class="${type}">$1</span>`;

function runHighlighter(): void{
  if(editor.children.item(1)){
    editor.children.item(1).remove();
  }

  const elem = document.createElement("pre");
  elem.classList.add("highlight");

  elem.innerHTML = textarea.value
    .replace(/([-\.*/"=]+?)/g, highlightSpan("symbol"))
    .replace(/(#.*?$)/gm, highlightSpan("comment"))
    .replace(/([0-9]+)/g, highlightSpan("number"))
    .replace(HIGHLIGHT_HEADERS_REGEX, highlightSpan("header"))
    .replace(HIGHLIGHT_KEYWORDS_REGEX, highlightSpan("keyword"))
    .replace(/\n/g, "<br>");

  editor.appendChild(elem);
}

textarea.onscroll = () => {
  editor.children.item(1).scrollTop = textarea.scrollTop;
};

window.onload = () => {
  if(!canvas){
    return;
  }

  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext;
  if(!gl){
    return;
  }

  textarea.onkeyup = (e) => {
    textarea.value = (e.currentTarget as HTMLTextAreaElement).value.trim();

    // don't preform unnecessary updates if source hasn't changed
    if(textarea.value === source){
      return;
    }
    source = textarea.value;

    parseSource();

    updateMesh(gl);
    runHighlighter();
    localStorage.setItem("bzw", source);
  };

  let drag = false;
  let oldX = 0, oldY = 0;
  let dX = 0, dY = 0;

  const mouseDown = (e: any) => {
    drag = true;
    oldX = getCoord(e, "X");
    oldY = getCoord(e, "Y");
    e.preventDefault();
    return false;
  };

  const mouseUp = () => {
    drag = false;
  };

  const mouseMove = (e: any) => {
    if(!drag){
      return false;
    }

    const x = getCoord(e, "X");
    const y = getCoord(e, "Y");

    dX = (x - oldX) * MOUSE_SPEED * Math.PI / canvas.width;
    dY = (y - oldY) * MOUSE_SPEED * Math.PI / canvas.height;
    THETA += dX;
    PHI += dY;
    oldX = x
    oldY = y;
    e.preventDefault();
  };

  canvas.addEventListener("mousedown", mouseDown, false);
  canvas.addEventListener("mouseup", mouseUp, false);
  canvas.addEventListener("mouseout", mouseUp, false);
  canvas.addEventListener("mousemove", mouseMove, false);
  // mobile
  canvas.addEventListener("touchstart", mouseDown, false);
  canvas.addEventListener("touchend", mouseUp, false);
  canvas.addEventListener("touchmove", mouseMove, false);

  canvas.addEventListener("wheel", (e): void => {
    const delta = (e as WheelEvent).deltaY;
    viewMatrix[14] += delta / Math.abs(delta) * (viewMatrix[14] / 10);
    viewMatrix[14] = viewMatrix[14] > -30 ? -30 : viewMatrix[14] < -map.worldSize * 2 ? -map.worldSize * 2 : viewMatrix[14];
  });

  let THETA = 45, PHI = 20, oldTime = 0;

  const shader = createShader(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if(!shader){
    return;
  }
  gl.useProgram(shader);

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj"), false, getProjection(60, canvas.width/canvas.height, .01, map.worldSize * 6));
  const vMatrix = gl.getUniformLocation(shader, "view");
  const mMatrix = gl.getUniformLocation(shader, "model");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.CULL_FACE);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);

  const render = (time: number) => {
    if(oldTime === 0){
      oldTime = time;
    }
    const dt = time - oldTime;
    oldTime = time;

    if(!drag && autoRotate.checked){
      THETA += .015 * dt;
    }

    if(PHI > 90){
      PHI = 90;
    }else if(PHI < -90){
      PHI = -90;
    }

    const finalModelMatrix = multiplyArrayOfMatrices([
      rotateXMatrix(-PHI),
      rotateYMatrix(-THETA),
      modelMatrix,
    ]);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(vMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mMatrix, false, finalModelMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

    gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  };

  parseSource();
  updateMesh(gl);
  requestAnimationFrame(render);
};

const parseSource = (): void => {
  let current = "";
  map.objects = [];

  for(let line of source.split("\n")){
    line = line.trim().replace(/ +(?= )/g, "");
    if(line[0] === "#"){
      continue;
    }

    if(line === "end"){
      current = "";
    }else if(line === "world"){
      current = "world";
    }else if(line === "box" || line === "pyramid" || line === "base"){
      current = line;
      map.objects.push({type: current as MapObjectType, scale: [.5, .5, 1], position: [0, 0, 0], shift: [0, 0, 0], rotation: 0});
    }else{
      const parts = line.split(" ");
      switch(current){
        case "world":
          if(parts[0] === "size"){
            map.worldSize = parseFloat(line.split(" ")[1]) || 100;
          }
          break;
        case "box":
        case "pyramid":
        case "base":
          if(parts[0] === "size"){
            map.objects[map.objects.length - 1].scale = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])] || [.5, .5, 1];
            if(parseFloat(parts[3]) === 0){
              map.objects[map.objects.length - 1].scale[2] = .01;
            }
          }else if(parts[0] === "position"){
            map.objects[map.objects.length - 1].position = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])] || [0, 0, 0];
          }else if(parts[0] === "shift"){
            map.objects[map.objects.length - 1].shift = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])] || [0, 0, 0];
          }else if(parts[0] === "rotation"){
            map.objects[map.objects.length - 1].rotation = parseFloat(parts[1]) || 0;
          }else if(parts[0] === "color"){
            if(current === "base"){
              map.objects[map.objects.length - 1].color = [parseFloat(parts[1]), parseFloat(parts[1]), parseFloat(parts[1]), 1] || [1, 1, 1, 1];
            }else{
              map.objects[map.objects.length - 1].color = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])] || [1, 1, 1, 1];
            }
          }
          break;
        default:
          break;
      }
    }
  }
};

const updateMesh = (gl: WebGLRenderingContext): void => {
  console.log("updating mesh");
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let indicesCount = 0;

  const pushIndices = (): void => {
    indices.push(indicesCount);
    indices.push(indicesCount + 1);
    indices.push(indicesCount + 2);
    indices.push(indicesCount + 2);
    indices.push(indicesCount + 3);
    indices.push(indicesCount);
    indicesCount += 4;
  };

  const pushIndices2 = (): void => {
    indices.push(indicesCount);
    indices.push(indicesCount + 1);
    indices.push(indicesCount + 2);
    indicesCount += 3;
  };

  const pushColors = (count = 1, r = 0, g = 0, b = 0, a = 1): void => {
    for(let i = 0; i < count; i++){
      colors.push(r, g, b, a);
    }
  };

  const applyRotPosShift = (object: IMapObject) => {
    const vertexCount = object.type === MapObjectType.BOX || object.type === MapObjectType.BASE ? 72 : object.type === MapObjectType.PYRAMID ? 48 : 0;
    if(vertexCount === 0){
      console.error("this should not happen");
      return;
    }

    const _rotation = object.rotation * Math.PI / 180;

    // apply rotation
    for(let i = vertices.length - vertexCount; i < vertices.length; i += 3){
      const rot = rotY([vertices[i], vertices[i + 1], vertices[i + 2]], _rotation);
      vertices[i] = rot[0];
      vertices[i + 1] = rot[1];
      vertices[i + 2] = rot[2];
    }

    // apply position + shift
    for(let i = vertices.length - vertexCount; i < vertices.length; i += 3){
      vertices[i] -= object.position[0] + object.shift[0];
    }
    for(let i = vertices.length - (vertexCount - 1); i < vertices.length; i += 3){
      vertices[i] += object.position[2] + object.shift[2];
    }
    for(let i = vertices.length - (vertexCount - 2); i < vertices.length; i += 3){
      vertices[i] += object.position[1] + object.shift[1];
    }
  };

  const addBox = (object: IMapObject): void => {
    if(object.type !== MapObjectType.BOX && object.type !== MapObjectType.BASE){
      return;
    }

    if(!object.color){
      object.color = [.61, .26, .12, 1];
    }

    const {scale, position, shift, rotation, color} = object;

    // top
    vertices.push(-scale[0], scale[2], -scale[1]);
    vertices.push(-scale[0], scale[2],  scale[1]);
    vertices.push( scale[0], scale[2],  scale[1]);
    vertices.push( scale[0], scale[2], -scale[1]);
    pushIndices();

    // bottom
    vertices.push( scale[0], 0, -scale[1]);
    vertices.push( scale[0], 0,  scale[1]);
    vertices.push(-scale[0], 0,  scale[1]);
    vertices.push(-scale[0], 0, -scale[1]);
    pushIndices();

    // back
    vertices.push( scale[0], 0       , -scale[1]);
    vertices.push(-scale[0], 0       , -scale[1]);
    vertices.push(-scale[0], scale[2], -scale[1]);
    vertices.push( scale[0], scale[2], -scale[1]);
    pushIndices();

    // front
    vertices.push( scale[0], scale[2], scale[1]);
    vertices.push(-scale[0], scale[2], scale[1]);
    vertices.push(-scale[0], 0       , scale[1]);
    vertices.push( scale[0], 0       , scale[1]);
    pushIndices();

    // left
    vertices.push(-scale[0], 0       , -scale[1]);
    vertices.push(-scale[0], 0       ,  scale[1]);
    vertices.push(-scale[0], scale[2],  scale[1]);
    vertices.push(-scale[0], scale[2], -scale[1]);
    pushIndices();

    // right
    vertices.push(scale[0], scale[2], -scale[1]);
    vertices.push(scale[0], scale[2],  scale[1]);
    vertices.push(scale[0], 0       ,  scale[1]);
    vertices.push(scale[0], 0       , -scale[1]);
    pushIndices();

    const _rotation = rotation * Math.PI / 180;

    if(object.type === MapObjectType.BOX){
      pushColors(4, color[0], color[1], color[2], color[3]);
      pushColors(4, color[0] * .7, color[1] * .7, color[2] * .7, color[3]);
      pushColors(8, color[0] * .9, color[1] * .9, color[2] * .9, color[3]);
      pushColors(8, color[0] * .8, color[1] * .8, color[2] * .8, color[3]);
    }else if(object.type === MapObjectType.BASE){
      let baseColor = [1, 1, 0];
      switch(color[0]){
        case 1:
          baseColor = [1, 0, 0];
          break;
        case 2:
          baseColor = [0, 1, 0];
          break;
        case 3:
          baseColor = [0, 0, 1];
          break;
        case 4:
          baseColor = [.8, 0, 1];
          break;
      }

      pushColors(4, baseColor[0], baseColor[1], baseColor[2], color[3]);
      pushColors(4, baseColor[0] * .7, baseColor[1] * .7, baseColor[2] * .7, color[3]);
      pushColors(8, baseColor[0] * .9, baseColor[1] * .9, baseColor[2] * .9, color[3]);
      pushColors(8, baseColor[0] * .8, baseColor[1] * .8, baseColor[2] * .8, color[3]);
    }
  };

  const addPyramid = (object: IMapObject): void => {
    if(object.type !== MapObjectType.PYRAMID){
      return;
    }

    if(!object.color){
      object.color = [.1, .3, 1, 1];
    }

    const {scale, position, shift, rotation, color} = object;

    // bottom
    vertices.push( scale[0], 0, -scale[1]);
    vertices.push( scale[0], 0,  scale[1]);
    vertices.push(-scale[0], 0,  scale[1]);
    vertices.push(-scale[0], 0, -scale[1]);
    pushIndices();

    // front
    vertices.push( scale[0], 0       , scale[1]);
    vertices.push( 0       , scale[2], 0);
    vertices.push(-scale[0], 0       , scale[1]);
    pushIndices2();

    // back
    vertices.push(-scale[0], 0       , -scale[1]);
    vertices.push( 0       , scale[2],  0);
    vertices.push( scale[0], 0       , -scale[1]);
    pushIndices2();

    // left
    vertices.push(-scale[0], 0       , scale[1]);
    vertices.push( 0       , scale[2], 0);
    vertices.push(-scale[0], 0       , -scale[1]);
    pushIndices2();

    // right
    vertices.push(scale[0], 0       , -scale[1]);
    vertices.push(0       , scale[2], 0);
    vertices.push(scale[0], 0       , scale[1]);
    pushIndices2();

    pushColors(4, color[0] * .8, color[1] * .8, color[2] * .8, color[3]);
    pushColors(6, color[0] * .9, color[1] * .9, color[2] * .9, color[3]);
    pushColors(6, color[0], color[1], color[2], color[3]);
  };

  // ground
  vertices.push( map.worldSize, 0,  map.worldSize);
  vertices.push( map.worldSize, 0, -map.worldSize);
  vertices.push(-map.worldSize, 0, -map.worldSize);
  vertices.push(-map.worldSize, 0,  map.worldSize);
  pushIndices();
  pushColors(4, .3, .75, .3);

  objectLoop: for(const object of map.objects){
    switch(object.type){
      case MapObjectType.BOX:
      case MapObjectType.BASE:
        addBox(object);
        break;
      case MapObjectType.PYRAMID:
        addPyramid(object);
        break;
      default:
        continue objectLoop;
    }

    applyRotPosShift(object);
  }

  elementCount = indices.length;

  gl.deleteBuffer(vbo);
  gl.deleteBuffer(cbo);
  gl.deleteBuffer(ebo);

  vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  cbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  ebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);
};

const getCoord = (e: any, coord: "X" | "Y"): number => {
  return e.touches ? e.touches[0][`page${coord}`] : e[`page${coord}`];
};
