import {getProjection, multiplyArrayOfMatrices, rotateXMatrix, rotateYMatrix} from "./math.ts";
import {VERTEX_SHADER, FRAGMENT_SHADER, createShader} from "./gl.ts";
import {highlight} from "./highlight.ts";
import {MapObject, IMesh, Box, Base, Pyramid, World, Zone} from "./bzw/mod.ts";

const textarea = document.querySelector(".editor textarea") as HTMLTextAreaElement;
const editor = document.querySelector(".editor") as HTMLDivElement;
const canvas = document.querySelector("canvas");

const autoRotate = document.querySelector("#auto-rotate") as HTMLInputElement;
const showAxis = document.querySelector("#show-axis") as HTMLInputElement;

const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
if(!gl){
  alert("WebGL 2.0 not available");
}

const textareaChanged = () => {
  // don't preform unnecessary updates if source hasn't changed
  if(textarea.value === source){
    return;
  }
  source = textarea.value;

  parseSource();

  updateMesh(gl);
  highlight(editor);
  localStorage.setItem("bzw", source);
};

document.querySelector("#bzw-file").addEventListener("change", (e: Event) => {
  const file = (e.currentTarget as HTMLInputElement).files[0];
  if(!file){
    alert("No file selected!");
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", (e) => {
    const text = e.target?.result;
    textarea.value = text as string;
    textareaChanged();
  });

  reader.addEventListener("error", () => {
    alert("Error: failed to read file");
  });

  reader.readAsText(file);
});

const viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-300,1];
const modelMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

const MOUSE_SPEED = 75;

let source = localStorage.getItem("bzw") || `# sample world\n\nworld\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend`;
textarea.value = source;
setTimeout(() => highlight(editor));

let vbo: WebGLBuffer, cbo: WebGLBuffer, ebo: WebGLBuffer;
let elementCount = 0;

const map: {
  worldSize: number,
  objects: MapObject[]
} = {
  worldSize: 400,
  objects: []
};

textarea.onscroll = () => {
  const highlighter = editor.children.item(1);
  if(highlighter){
    highlighter.scrollTop = textarea.scrollTop;
  }
};

textarea.onkeyup = (e: Event) => {
  textarea.value = (e.currentTarget as HTMLTextAreaElement).value;
  textareaChanged();
};

window.onload = () => {
  if(!canvas){
    return;
  }

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

  let THETA = 0, PHI = 30, oldTime = 0;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const shader = createShader(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if(!shader){
    return;
  }
  gl.useProgram(shader);

  const vMatrix = gl.getUniformLocation(shader, "view");
  const mMatrix = gl.getUniformLocation(shader, "model");

  const AXIS_LINE_LENGTH = 100;
  const axisVertices = [
    // x
     0,                0, 0,
    -AXIS_LINE_LENGTH, 0, 0,
    // y
     0, 0,                0,
     0, AXIS_LINE_LENGTH, 0,
    // z
     0, 0, 0,
     0, 0, AXIS_LINE_LENGTH,
  ];
  const axisColors = [
    // x
    1, 0, 0, 1, 1, 0, 0, 1,
    // y
    0, 1, 0, 1, 0, 1, 0, 1,
    // z
    0, 0, 1, 1, 0, 0, 1, 1
  ];

  var axisVao = gl.createVertexArray();
  gl.bindVertexArray(axisVao);

  const axisVbo = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, axisVbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisVertices), gl.STATIC_DRAW);

  const axisCbo = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, axisCbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisColors), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, axisVbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, axisCbo);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  gl.deleteBuffer(axisVbo);
  gl.deleteBuffer(axisCbo);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.CULL_FACE);
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj"), false, getProjection(60, canvas.width/canvas.height, .01, map.worldSize * 6));

    gl.uniformMatrix4fv(vMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mMatrix, false, finalModelMatrix);

    gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_SHORT, 0);

    if(showAxis.checked){
      gl.disable(gl.DEPTH_TEST);

      gl.bindVertexArray(axisVao);
      gl.drawArrays(gl.LINES, 0, 6);
      gl.bindVertexArray(null);

      gl.enable(gl.DEPTH_TEST);
    }

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
      current = line;
      map.objects.push(new World());
    }else if(line === "box"){
      current = line;
      map.objects.push(new Box());
    }else if(line === "pyramid"){
      current = line;
      map.objects.push(new Pyramid());
    }else if(line === "base"){
      current = line;
      map.objects.push(new Base());
    }else if(line === "zone"){
      current = line;
      map.objects.push(new Zone());
    }else{
      switch(current){
        case "world":
        case "box":
        case "pyramid":
        case "base":
        case "zone":
          map.objects[map.objects.length - 1].parseLine(line);

          if(current === "world" && line.startsWith("size")){
            map.worldSize = (map.objects[map.objects.length - 1] as World).size[0];
          }
          break;
        default:
          break;
      }
    }
  }
};

const updateMesh = (gl: WebGL2RenderingContext ): void => {
  console.log("updating mesh");
  const mesh: IMesh = {
    vertices: [],
    indices: [],
    colors: [],
    indicesCount: 0
  };

  if(map.objects.filter((object) => object instanceof World).length === 0){
    map.objects.push(new World());
    map.worldSize = map.objects[map.objects.length - 1].size[0];
  }

  map.objects = map.objects.sort((a, b) => (a.color ? a.color[3] : 1) > (b.color ? b.color[3] : 1) ? 1 : -1);
  for(const object of map.objects){
    object.buildMesh(mesh);
  }

  elementCount = mesh.indices.length;

  gl.deleteBuffer(vbo);
  gl.deleteBuffer(cbo);
  gl.deleteBuffer(ebo);

  vbo = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

  cbo = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.colors), gl.STATIC_DRAW);

  ebo = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

const getCoord = (e: any, coord: "X" | "Y"): number => {
  return e.touches ? e.touches[0][`page${coord}`] : e[`page${coord}`];
};
