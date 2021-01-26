import * as math from "./math.ts";
import {VERTEX_SHADER, FRAGMENT_SHADER, createShader} from "./gl.ts";
import {highlight, deleteHighlightElement} from "./highlight/mod.ts";
import * as bzw from "./bzw/mod.ts";
import * as dom from "./dom/mod.ts";
import {getCoord, saveFile, colorThemeChanged} from "./utils.ts";
import "./editor/mod.ts";

const MAX_ZOOM = -5;
const MOUSE_SPEED = 100;
const EDITOR_CHANGE_TIMEOUT = 15;
const NEAR_PLANE = 1;

colorThemeChanged();

const gl = dom.canvas.getContext("webgl2") as WebGL2RenderingContext;
if(!gl){
  alert("WebGL 2.0 not available");
}

let source = localStorage.getItem("bzw") || `# sample world\n\nworld\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend\n`;
dom.textarea.value = source;

let vbo: WebGLBuffer, cbo: WebGLBuffer, ebo: WebGLBuffer;
let elementCount = 0;

let map: bzw.IMap = {
  worldSize: 400,
  objects: []
};

/** Handle a file being uploaded */
function handleFile(files: FileList | null | undefined){
  const file = files ? files[0] : undefined;
  if(!file){
    alert("No file selected!");
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    const text = reader.result;
    dom.textarea.value = text as string;
    textareaChanged();
  });

  reader.addEventListener("error", () => {
    alert("Error: failed to read file");
  });

  reader.readAsText(file);
}

/** Save map to device */
function saveMap(){
  saveFile("map.bzw", source);
}

/** Update line numbers to match source */
function updateLineNumbers(){
  dom.lineNumbersElement.innerHTML = [...Array(source.split("\n").length).keys()].map((i) => i + 1).join("\n");
  dom.lineNumbersElement.scrollTop = dom.textarea.scrollTop;
}

/** Raw handler for textarea being changed */
function _textareaChanged(){
  // don't preform unnecessary updates if source hasn't changed
  if(dom.textarea.value === source){
    return;
  }

  if(dom.settings.syntaxHighlighting.checked){
    highlight(source);
  }

  source = dom.textarea.value;
  updateLineNumbers();
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
  dom.textarea.focus();

  let selectionStart = dom.textarea.selectionStart;
  const currentLineNumber = dom.textarea.value.substr(0, selectionStart).split("\n").length - 1;
  const lines = dom.textarea.value.split("\n");

  if(lines[currentLineNumber].startsWith("#")){ // remove comment
    lines[currentLineNumber] = lines[currentLineNumber].substr(1);
    selectionStart--;
  }else{ // add comment
    lines[currentLineNumber] = "#" + lines[currentLineNumber];
    selectionStart++;
  }

  dom.textarea.value = lines.join("\n");
  textareaChanged();
  dom.textarea.selectionEnd = selectionStart;
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

function syntaxHighlightingChanged(){
  if(dom.settings.syntaxHighlighting.checked){
    dom.textarea.classList.remove("show");
    highlight();
  }else{
    dom.textarea.classList.add("show");
    deleteHighlightElement();
  }
}

dom.settings.autoRotate.addEventListener("change", () => {
  localStorage.setItem("autoRotate", dom.settings.autoRotate.checked ? "true" : "false");
});

dom.settings.showAxis.addEventListener("change", () => {
  localStorage.setItem("showAxis", dom.settings.showAxis.checked ? "true" : "false");
});

dom.settings.syntaxHighlighting.addEventListener("change", () => {
  localStorage.setItem("syntaxHighlighting", dom.settings.syntaxHighlighting.checked ? "true" : "false");
  syntaxHighlightingChanged();
});

dom.bzwFile.addEventListener("change", () => {
  handleFile(dom.bzwFile.files);
});

dom.textarea.onscroll = () => {
  const highlighter = dom.editor.children.item(1);
  if(highlighter){
    highlighter.scrollTop = dom.textarea.scrollTop;
    highlighter.scrollLeft = dom.textarea.scrollLeft;
  }

  dom.lineNumbersElement.scrollTop = dom.textarea.scrollTop;
};

dom.textarea.oninput = () => textareaChanged();

// custom keyboard shotcuts (editor)
dom.textarea.onkeydown = (e: KeyboardEvent) => {
  if(e.keyCode === 191 && e.ctrlKey){ // Ctrl+/ (toggle comment)
    e.preventDefault();
    toggleComment();
  }else if(e.keyCode === 83 && e.ctrlKey){ // Ctrl+S (save)
    e.preventDefault();
    saveMap();
  }
};

let selectedMapObject: bzw.MapObject | undefined;
function selectedMapObjectChanged(){
  if(!selectedMapObject){
    dom.tree.properties.style.display = "none";
    return;
  }

  // remove all children
  while(dom.tree.properties.lastChild){
    dom.tree.properties.lastChild.remove();
  }

  const properties = Object.keys(selectedMapObject);
  const values = Object.values(selectedMapObject);

  const typeElement = document.createElement("div");
  typeElement.innerText = `type: ${selectedMapObject.HEADER}`;
  dom.tree.properties.appendChild(typeElement);

  for(const i in properties){
    const property = properties[i];
    const value = values[i];

    if(["vertexCount", "HEADER"].includes(property)){
      continue;
    }

    const nameElement = document.createElement("span");
    nameElement.innerText = property;
    dom.tree.properties.appendChild(nameElement);

    const valueElement = document.createElement("div");

    const createInputElement = (type: "text" | "number" | "checkbox", value: unknown, changedHandler: (inputElement: HTMLInputElement) => void): HTMLInputElement => {
      const inputElement = document.createElement("input") as HTMLInputElement;
      inputElement.type = type;

      if(type === "checkbox"){
        inputElement.checked = value;
      }else{
        inputElement.value = value;
      }

      inputElement.addEventListener("change", () => {
        if(!selectedMapObject){
          return;
        }

        changedHandler(inputElement);
      });

      valueElement.appendChild(inputElement);
    };

    switch(typeof value){
      case "string": {
        createInputElement("text", value, (inputElement) => {
          selectedMapObject[property] = inputElement.value;
        });
      } break;
      case "number": {
        createInputElement("number", `${value}`, (inputElement) => {
          selectedMapObject[property] = inputElement.value;
        });
      } break;
      case "boolean": {
        createInputElement("checkbox", value, (inputElement) => {
          selectedMapObject[property] = inputElement.checked;
        });
      } break;
      case "object": {
        if(Array.isArray(value) && typeof value[0] === "number"){
          for(const valueIndex in value){
            createInputElement("number", `${value[valueIndex]}`, (inputElement) => {
              selectedMapObject[property][valueIndex] = bzw.parseNum(inputElement.value);
            });
          }

          break;
        }
      } // notice no break as we may not handle it
      default:
        valueElement.innerText = "unsupported property";
        break;
    }

    dom.tree.properties.appendChild(valueElement);
  }

  dom.tree.properties.style.display = "flex";
}

dom.tree.objects.addEventListener("click", (e: Event) => {
  const target = e.target as HTMLElement;
  if(!target || !target.parentElement || !target.parentElement.classList.contains("objects")){
    return;
  }

  for(const selected of dom.tree.objects.querySelectorAll<HTMLDivElement>(".selected")){
    selected.classList.remove("selected");
  }
  target.classList.add("selected");

  const index = Array.from(target.parentElement.children).indexOf(target);
  selectedMapObject = map.objects[index];
  selectedMapObjectChanged();
});

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
    dom.bzwFile.click();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if(!dom.canvas){
    return;
  }

  const viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-map.worldSize,1];
  const modelMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

  let drag = false;
  let oldX = 0, oldY = 0;
  let dX = 0, dY = 0;
  let THETA = 0, PHI = 40, oldTime = 0;

  // set canvas size to match element size
  dom.canvas.width = dom.canvas.offsetWidth;
  dom.canvas.height = dom.canvas.offsetHeight;

  const mouseDown = (e: Event) => {
    e.preventDefault();

    drag = true;
    oldX = getCoord(e, "X");
    oldY = getCoord(e, "Y");
  };

  const mouseUp = () => {
    drag = false;
  };

  const mouseMove = (e: Event) => {
    e.preventDefault();

    if(!drag){
      return;
    }

    const x = getCoord(e, "X");
    const y = getCoord(e, "Y");

    dX = (x - oldX) * MOUSE_SPEED * Math.PI / dom.canvas.width;
    dY = (y - oldY) * MOUSE_SPEED * Math.PI / dom.canvas.height;
    THETA += dX;
    PHI += dY;
    oldX = x
    oldY = y;
  };

  dom.canvas.addEventListener("mousedown", mouseDown, false);
  dom.canvas.addEventListener("mouseup", mouseUp, false);
  dom.canvas.addEventListener("mouseout", mouseUp, false);
  dom.canvas.addEventListener("mousemove", mouseMove, false);
  // mobile
  dom.canvas.addEventListener("touchstart", mouseDown, false);
  dom.canvas.addEventListener("touchend", mouseUp, false);
  dom.canvas.addEventListener("touchmove", mouseMove, false);

  dom.canvas.addEventListener("wheel", (e: WheelEvent): void => {
    const delta = e.deltaY;
    viewMatrix[14] += delta / Math.abs(delta) * (viewMatrix[14] / 10);
    viewMatrix[14] = viewMatrix[14] > MAX_ZOOM ? MAX_ZOOM : viewMatrix[14] < -map.worldSize * 3 ? -map.worldSize * 3 : viewMatrix[14];
  });

  const shader = createShader(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if(!shader){
    return alert("Error creating shader");
  }
  gl.useProgram(shader);

  const vMatrix = gl.getUniformLocation(shader, "view");
  const mMatrix = gl.getUniformLocation(shader, "model");

  const AXIS_LINE_LENGTH = 100;
  const axisVertices = [
    // x
    0,                0, 0,
    AXIS_LINE_LENGTH, 0, 0,
    // y
    0, 0,                0,
    0, AXIS_LINE_LENGTH, 0,
    // z
    0, 0, 0,
    0, 0, -AXIS_LINE_LENGTH,
  ];
  const axisColors = [
    // x
    1, 0, 0, 1, 1, 0, 0, 1,
    // y
    0, 1, 0, 1, 0, 1, 0, 1,
    // z
    0, 0, 1, 1, 0, 0, 1, 1
  ];

  const axisVao = gl.createVertexArray();
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

    if(!drag && dom.settings.autoRotate.checked){
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
    gl.viewport(0, 0, dom.canvas.width, dom.canvas.height);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "proj"), false, math.getProjection(60, dom.canvas.width/dom.canvas.height, NEAR_PLANE, map.worldSize * 5));

    gl.uniformMatrix4fv(vMatrix, false, viewMatrix);
    gl.uniformMatrix4fv(mMatrix, false, finalModelMatrix);

    gl.drawElements(gl.TRIANGLES, elementCount, gl.UNSIGNED_SHORT, 0);

    if(dom.settings.showAxis.checked){
      gl.disable(gl.DEPTH_TEST);

      gl.bindVertexArray(axisVao);
      gl.drawArrays(gl.LINES, 0, 6);
      gl.bindVertexArray(null);

      gl.enable(gl.DEPTH_TEST);
    }

    requestAnimationFrame(render);
  };

  // load settings
  dom.settings.autoRotate.checked = localStorage.getItem("autoRotate") === "true";
  dom.settings.showAxis.checked = localStorage.getItem("showAxis") !== "false";
  dom.settings.syntaxHighlighting.checked = localStorage.getItem("syntaxHighlighting") !== "false";

  updateMesh(gl);

  setTimeout(() => {
    updateLineNumbers();
    deleteHighlightElement();
    syntaxHighlightingChanged();
  });

  requestAnimationFrame(render);
});

/** Update world mesh */
function updateMesh(gl: WebGL2RenderingContext){
  map = bzw.parse(source);

  dom.tree.objects.innerHTML = "";
  for(const object of map.objects){
    const div = document.createElement("div");
    div.innerText = object.name || object.HEADER;
    dom.tree.objects.appendChild(div);
  }

  if(selectedMapObject && map.objects.indexOf(selectedMapObject) < 0){
    selectedMapObject = undefined;
    selectedMapObjectChanged();
  }

  const mesh: bzw.IMesh = {
    vertices: [],
    indices: [],
    colors: [],
    indicesCount: 0
  };

  // add world object if one doesn't already exist
  if(!map.objects.find((object) => object instanceof bzw.objects.World)){
    map.objects.push(new bzw.objects.World());
    map.worldSize = (map.objects[map.objects.length - 1] as bzw.objects.World).size;
  }

  // sort by alpha
  for(const object of [...map.objects].sort((a: any, b: any) => (a.color?.[3] ?? 1) > (b.color?.[3] ?? 1) ? 1 : -1)){
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

  dom.statusBar.objects.innerText = `${map.objects.length} Objects`;
  dom.statusBar.vertices.innerText = `${elementCount} Vertices`;
}
