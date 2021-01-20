import * as math from "./math.ts";
import {VERTEX_SHADER, FRAGMENT_SHADER, createShader} from "./gl.ts";
import {highlight, deleteHighlightElement} from "./highlight/mod.ts";
import {MapObject, IMesh, Box, MeshBox, Base, Pyramid, MeshPyramid, World, Zone} from "./bzw/mod.ts";
import {elements} from "./dom/mod.ts";
import "./editor/mod.ts";

const MAX_ZOOM = -5;
const MOUSE_SPEED = 100;
const EDITOR_CHANGE_TIMEOUT = 15;
const NEAR_PLANE = 1;

elements.settings.autoRotate.checked = localStorage.getItem("autoRotate") === "true";
elements.settings.showAxis.checked = localStorage.getItem("showAxis") !== "false";
elements.settings.syntaxHighlighting.checked = localStorage.getItem("syntaxHighlighting") !== "false";

colorThemeChanged();

const gl = elements.canvas.getContext("webgl2") as WebGL2RenderingContext;
if(!gl){
  alert("WebGL 2.0 not available");
}

let source = localStorage.getItem("bzw") || `# sample world\n\nworld\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend`;
elements.textarea.value = source;

let vbo: WebGLBuffer, cbo: WebGLBuffer, ebo: WebGLBuffer;
let elementCount = 0;

const map: {
  worldSize: number,
  objects: MapObject[]
} = {
  worldSize: 400,
  objects: []
};

/** Smartly get coordinate for input */
function getCoord(e: any, coord: "X" | "Y"): number{
  return e.touches ? e.touches[0][`page${coord}`] : e[`page${coord}`];
}

/** Handle a file being uploaded */
function handleFile(files: FileList | null | undefined){
  const file = files ? files[0] : undefined;
  if(!file){
    alert("No file selected!");
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", (e) => {
    const text = e.target?.result;
    elements.textarea.value = text as string;
    textareaChanged();
  });

  reader.addEventListener("error", () => {
    alert("Error: failed to read file");
  });

  reader.readAsText(file);
}

/** Update line numbers to match source */
function updateLineNumbers(){
  elements.lineNumbersElement.innerHTML = [...Array(source.split("\n").length).keys()].map((i) => i + 1).join("\n");
  elements.lineNumbersElement.scrollTop = elements.textarea.scrollTop;
}

/** Raw handler for textarea being changed */
function _textareaChanged(){
  // don't preform unnecessary updates if source hasn't changed
  if(elements.textarea.value === source){
    return;
  }

  if(elements.settings.syntaxHighlighting.checked){
    highlight(source);
  }

  source = elements.textarea.value;
  updateLineNumbers();
  parseSource();
  updateMesh(gl);

  localStorage.setItem("bzw", source);
}

let timeoutId = 0;
/** Smart handler for textarea being changed */
function textareaChanged(){
  if(timeoutId){
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => _textareaChanged(), EDITOR_CHANGE_TIMEOUT);
}

/** Toggle current line as a comment */
function toggleComment(){
  elements.textarea.focus();

  let selectionStart = elements.textarea.selectionStart;
  const currentLineNumber = elements.textarea.value.substr(0, selectionStart).split("\n").length - 1;
  const lines = elements.textarea.value.split("\n");

  if(lines[currentLineNumber].startsWith("#")){ // remove comment
    lines[currentLineNumber] = lines[currentLineNumber].substr(1);
    selectionStart--;
  }else{ // add comment
    lines[currentLineNumber] = "#" + lines[currentLineNumber];
    selectionStart++;
  }

  elements.textarea.value = lines.join("\n");
  textareaChanged();
  elements.textarea.selectionEnd = selectionStart;
}

function setColorTheme(e?: Event){
  if(!e){
    return;
  }

  const target = (e.target as HTMLElement);

  // ignore if we clicked the menu element
  if(target.classList.contains("menu")){
    return;
  }

  localStorage.setItem("colorTheme", target.innerText.toLowerCase().replace(/ /g, "-"));
  colorThemeChanged();
}
setColorTheme(); // FIXME: this is a hack so the function is not removed

function colorThemeChanged(){
  document.documentElement.setAttribute("data-theme", localStorage.getItem("colorTheme") ?? "default");
}

function syntaxHighlightingChanged(){
  if(elements.settings.syntaxHighlighting.checked){
    elements.textarea.classList.remove("show");
    highlight();
  }else{
    elements.textarea.classList.add("show");
    deleteHighlightElement();
  }
}

elements.settings.autoRotate.addEventListener("change", () => {
  localStorage.setItem("autoRotate", elements.settings.autoRotate.checked ? "true" : "false");
});

elements.settings.showAxis.addEventListener("change", () => {
  localStorage.setItem("showAxis", elements.settings.showAxis.checked ? "true" : "false");
});

elements.settings.syntaxHighlighting.addEventListener("change", () => {
  syntaxHighlightingChanged();
  localStorage.setItem("syntaxHighlighting", elements.settings.syntaxHighlighting.checked ? "true" : "false");
});

elements.bzwFile.addEventListener("change", () => {
  handleFile(elements.bzwFile.files);
});

elements.textarea.onscroll = () => {
  const highlighter = elements.editor.children.item(1);
  if(highlighter){
    highlighter.scrollTop = elements.textarea.scrollTop;
    highlighter.scrollLeft = elements.textarea.scrollLeft;
  }

  elements.lineNumbersElement.scrollTop = elements.textarea.scrollTop;
};

elements.textarea.oninput = (e: Event) => {
  elements.textarea.value = (e.currentTarget as HTMLTextAreaElement).value;
  textareaChanged();
};

// custom keyboard shotcuts (editor)
elements.textarea.onkeydown = (e: KeyboardEvent) => {
  // Ctrl+/ (toggle comment)
  if(e.keyCode === 191 && e.ctrlKey){
    e.preventDefault();
    toggleComment();
  }
};

window.addEventListener("dragenter", (e: DragEvent) => {
  e.stopPropagation();
  e.preventDefault();
});

window.addEventListener("dragover", (e: DragEvent) => {
  e.stopPropagation();
  e.preventDefault();
});

window.addEventListener("drop", (e: DragEvent) => {
  e.stopPropagation();
  e.preventDefault();

  handleFile(e.dataTransfer?.files);
});

// custom keyboard shortcuts (global)
window.onkeydown = (e: KeyboardEvent) => {
  // Ctrl+O (open file)
  if(e.keyCode === 79 && e.ctrlKey){
    e.preventDefault();
    elements.bzwFile.click();
  }
};

window.onload = () => {
  if(!elements.canvas){
    return;
  }

  const viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-map.worldSize,1];
  const modelMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

  let drag = false;
  let oldX = 0, oldY = 0;
  let dX = 0, dY = 0;
  let THETA = 180, PHI = 40, oldTime = 0;

  elements.canvas.width = elements.canvas.offsetWidth;
  elements.canvas.height = elements.canvas.offsetHeight;

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

    dX = (x - oldX) * MOUSE_SPEED * Math.PI / elements.canvas.width;
    dY = (y - oldY) * MOUSE_SPEED * Math.PI / elements.canvas.height;
    THETA += dX;
    PHI += dY;
    oldX = x
    oldY = y;
    e.preventDefault();
  };

  elements.canvas.addEventListener("mousedown", mouseDown, false);
  elements.canvas.addEventListener("mouseup", mouseUp, false);
  elements.canvas.addEventListener("mouseout", mouseUp, false);
  elements.canvas.addEventListener("mousemove", mouseMove, false);
  // mobile
  elements.canvas.addEventListener("touchstart", mouseDown, false);
  elements.canvas.addEventListener("touchend", mouseUp, false);
  elements.canvas.addEventListener("touchmove", mouseMove, false);

  elements.canvas.addEventListener("wheel", (e): void => {
    const delta = (e as WheelEvent).deltaY;
    viewMatrix[14] += delta / Math.abs(delta) * (viewMatrix[14] / 10);
    viewMatrix[14] = viewMatrix[14] > MAX_ZOOM ? MAX_ZOOM : viewMatrix[14] < -map.worldSize * 3 ? -map.worldSize * 3 : viewMatrix[14];
  });

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
  gl.clearColor(0, 0, 0, 0);

  const render = (time: number) => {
    if(oldTime === 0){
      oldTime = time;
    }
    const dt = time - oldTime;
    oldTime = time;

    if(!drag && elements.settings.autoRotate.checked){
      THETA += .015 * dt;
    }

    if(PHI > 90){
      PHI = 90;
    }else if(PHI < -90){
      PHI = -90;
    }

    const finalModelMatrix = math.multiplyArrayOfMatrices([
      math.rotateXMatrix(-PHI),
      math.rotateYMatrix(-THETA),
      modelMatrix,
    ]);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, elements.canvas.width, elements.canvas.height);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj"), false, math.getProjection(50, elements.canvas.width/elements.canvas.height, NEAR_PLANE, map.worldSize * 5));

    gl.uniformMatrix4fv(vMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mMatrix, false, finalModelMatrix);

    gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_SHORT, 0);

    if(elements.settings.showAxis.checked){
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

/** Parse world source */
function parseSource(){
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
    }else if(line === "meshbox"){
      current = line;
      map.objects.push(new MeshBox());
    }else if(line === "pyramid"){
      current = line;
      map.objects.push(new Pyramid());
    }else if(line === "meshpyr"){
      current = line;
      map.objects.push(new MeshPyramid());
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
        case "meshbox":
        case "pyramid":
        case "meshpyr":
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

  elements.statusBar.objects.innerText = `${map.objects.length} Objects`;
}

/** Update world mesh */
function updateMesh(gl: WebGL2RenderingContext){
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

  map.objects = map.objects.sort((a, b) => (a.color ? a.color[3] : 1) > (b.color ? b.color[3] : 1) ? 1 : -1); // sort by alpha
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

  elements.statusBar.vertices.innerText = `${elementCount} Vertices`;
}

syntaxHighlightingChanged();
updateLineNumbers();
