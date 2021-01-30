import * as bzw from "./bzw/mod.ts";
import * as dom from "./dom/mod.ts";
import * as editor from "./editor/mod.ts";

import {highlight, deleteHighlightElement} from "./highlight/mod.ts";
import {trimText, saveFile, colorThemeChanged} from "./utils.ts";
import {Renderer} from "./renderer/mod.ts";

const EDITOR_CHANGE_TIMEOUT = 15;

colorThemeChanged();

const renderer = new Renderer(dom.canvas);

let source = localStorage.getItem("bzw") as string || `# sample world\n\nworld\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend\n`;
dom.textarea.value = source;

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
  saveFile(`${map.objects.find((object: bzw.MapObject) => object instanceof bzw.objects.World)?.name || "map"}.bzw`, source);
}

/** Raw handler for textarea being changed */
function _textareaChanged(shouldParseSource: boolean = true, forceHighlightUpdate: boolean = false){
  // don't preform unnecessary updates if source hasn't changed
  if(trimText(dom.textarea.value) === trimText(source)){
    return;
  }

  if(dom.settings.syntaxHighlighting.checked){
    if(forceHighlightUpdate){
      deleteHighlightElement();
    }
    highlight(source);
  }

  source = dom.textarea.value;
  dom.updateLineNumbers();
  if(shouldParseSource){
    parseSource();
  }
  updateMesh();

  localStorage.setItem("bzw", source);
}

let timeoutId = 0;
/** Smart handler for textarea being changed */
function textareaChanged(shouldParseSource: boolean = true, forceHighlightUpdate: boolean = false){
  if(timeoutId){
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => _textareaChanged(shouldParseSource, forceHighlightUpdate), EDITOR_CHANGE_TIMEOUT);
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
setColorTheme(); // HACK: this is so the function is not removed

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
    editor.toggleComment();
    textareaChanged();
  }
};

let selectedMapObjectIndex: number = 0;
function setSelectedMapObject(newIndex: number){
  if(newIndex === selectedMapObjectIndex){
    return;
  }
  selectedMapObjectIndex = newIndex;

  if(selectedMapObjectIndex < 0){
    dom.tree.properties.style.display = "none";
    return;
  }

  const selectedMapObject = map.objects[selectedMapObjectIndex];

  dom.removeAllChildren(dom.tree.properties);

  // add element saying object type
  const typeElement = document.createElement("div");
  typeElement.innerText = `type: ${selectedMapObject.HEADER}`;
  dom.tree.properties.appendChild(typeElement);

  const properties = Object.keys(selectedMapObject);
  const values = Object.values(selectedMapObject);

  for(const i in properties){
    const property = properties[i];
    const value = values[i];

    if(["vertexCount", "HEADER"].includes(property)){
      continue;
    }

     // ignore specific object properties
     if(
      selectedMapObject.HEADER === "zone" && property === "color" ||
      selectedMapObject.HEADER === "group" && property === "position"
    ){
      continue;
    }

    const nameElement = document.createElement("span");
    nameElement.innerText = property;
    dom.tree.properties.appendChild(nameElement);

    const valueElement = document.createElement("div");

    const createInputElement = (type: "text" | "number" | "checkbox", value: string | boolean, changedHandler: (inputElement: HTMLInputElement) => void): void => {
      const inputElement = document.createElement("input") as HTMLInputElement;
      inputElement.type = type;
      inputElement.spellcheck = false;

      if(type === "checkbox"){
        inputElement.checked = value as boolean;
      }else{
        inputElement.value = value as string;
      }

      inputElement.addEventListener("input", () => {
        if(selectedMapObjectIndex === -1){
          return;
        }

        changedHandler(inputElement);
        dom.textarea.value = bzw.mapToBZW(map);

        textareaChanged(undefined, true);
      });

      valueElement.appendChild(inputElement);
    };

    switch(typeof value){
      case "string": {
        createInputElement("text", value, (inputElement) => {
          map.objects[selectedMapObjectIndex][property] = inputElement.value;
        });
      } break;
      case "number": {
        createInputElement("number", `${value}`, (inputElement) => {
          map.objects[selectedMapObjectIndex][property] = inputElement.value;
        });
      } break;
      case "boolean": {
        createInputElement("checkbox", value, (inputElement) => {
          map.objects[selectedMapObjectIndex][property] = inputElement.checked;
        });
      } break;
      case "undefined": {
        const createElement = document.createElement("button") as HTMLButtonElement;
        createElement.classList.add("btn");
        createElement.innerText = "Edit";

        createElement.addEventListener("click", () => {
          if(selectedMapObjectIndex === -1){
            return;
          }

          if(property === "color"){
            map.objects[selectedMapObjectIndex][property] = [0, 0, 0, 1];
            dom.textarea.value = bzw.mapToBZW(map);
            textareaChanged(undefined, true);

            const index = parseInt(`${selectedMapObjectIndex}`); // deep clone
            selectedMapObjectIndex = -1;
            setSelectedMapObject(index);
          }else{
            alert("something somewhere is messed up big time");
          }
        });

        valueElement.appendChild(createElement);
      } break;
      case "object": {
        if(Array.isArray(value) && typeof value[0] === "number"){
          for(const valueIndex in value){
            createInputElement("number", `${value[valueIndex]}`, (inputElement) => {
              map.objects[selectedMapObjectIndex][property][valueIndex] = bzw.parseNum(inputElement.value);
            });
          }

          if(property === "color"){
            const deleteElement = document.createElement("button") as HTMLButtonElement;
            deleteElement.classList.add("btn");
            deleteElement.innerText = "Reset";

            deleteElement.addEventListener("click", () => {
              if(selectedMapObjectIndex === -1){
                return;
              }

              if(property === "color"){
                map.objects[selectedMapObjectIndex][property] = undefined;
                dom.textarea.value = bzw.mapToBZW(map);
                textareaChanged(undefined, true);

                const index = parseInt(`${selectedMapObjectIndex}`); // deep clone
                selectedMapObjectIndex = -1;
                setSelectedMapObject(index);
              }else{
                alert("something somewhere is messed up big time");
              }
            });

            valueElement.appendChild(deleteElement);
          }
        }else{
          valueElement.innerText = "unsupported property";
        }
      } break;
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
  setSelectedMapObject(index);
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
  if(e.keyCode === 83 && e.ctrlKey){ // Ctrl+S (save)
    e.preventDefault();
    saveMap();
  }else if(e.keyCode === 79 && e.ctrlKey){ // Ctrl+O (open file)
    e.preventDefault();
    dom.bzwFile.click();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // load settings
  dom.settings.autoRotate.checked = localStorage.getItem("autoRotate") === "true";
  dom.settings.showAxis.checked = localStorage.getItem("showAxis") !== "false";
  dom.settings.syntaxHighlighting.checked = localStorage.getItem("syntaxHighlighting") !== "false";

  parseSource();
  updateMesh();

  setTimeout(() => {
    dom.updateLineNumbers();
    deleteHighlightElement();
    syntaxHighlightingChanged();
  });
});

function parseSource(){
  const oldSelected = map.objects[selectedMapObjectIndex]?.toString() ?? "";

  map = bzw.parse(source);

  dom.removeAllChildren(dom.tree.objects);

  for(const object of map.objects){
    const div = document.createElement("div");
    div.innerText = object.name || object.HEADER;
    dom.tree.objects.appendChild(div);
  }

  if(selectedMapObjectIndex >= map.objects.length){ // objet no longer exists
    setSelectedMapObject(-1);
  }else if((map.objects[selectedMapObjectIndex]?.toString() ?? "") !== oldSelected){ // object has changed
    const index = parseInt(`${selectedMapObjectIndex}`); // deep clone
    selectedMapObjectIndex = -1;
    setSelectedMapObject(index);
  }
}

/** Update world mesh */
function updateMesh(){
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
  for(const object of [...map.objects].sort((a: any, b: any) => (a.color?.[3] ?? -1) > (b.color?.[3] ?? 1) ? 1 : -1)){
    object.buildMesh(mesh);
  }

  renderer.worldSize = map.worldSize;
  renderer.updateMesh(mesh);

  dom.statusBar.objects.innerText = `${map.objects.length} Objects`;
  dom.statusBar.vertices.innerText = `${mesh.indices.length} Vertices`;
}
