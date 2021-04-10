import * as bzw from "./bzw/mod.ts";
import * as dom from "./dom.ts";
import * as settings from "./settings.ts";
import "./editor/mod.ts";

import {saveFile, capitalize} from "./utils.ts";
import {Renderer} from "./renderer/mod.ts";

const EDITOR_CHANGE_TIMEOUT = 15;

const renderer = new Renderer(dom.canvas);

const randomMapID = Math.random().toString(36).slice(2);
let storageName = window.decodeURI(window.location.hash.slice(1) || randomMapID);
if(storageName === randomMapID){
  history.replaceState(null, "", `#${window.encodeURI(storageName)}`);
}

let source = localStorage.getItem(`map-${storageName}`) ?? `# sample world\n\nworld\n  name ${randomMapID}\n  size 200\nend\n\nbox\n  position 0 0 0\n  size 30 30 15\n  rotation 45\nend\n\npyramid\n  position 50 50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 50 0\n  size 5 5 50\nend\n\npyramid\n  position 50 -50 0\n  size 5 5 50\nend\n\npyramid\n  position -50 -50 0\n  size 5 5 50\nend\n\nbase\n  position -170 0 0\n  size 30 30 .5\n  color 1\nend\n\nbase\n  position 170 0 0\n  size 30 30 .5\n  color 2\nend\n`;

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
    source = text as string;
    sourceChanged();
  });

  reader.addEventListener("error", () => {
    alert("Error: failed to read file");
  });

  reader.readAsText(file);
}

/** Save map to device */
function saveMap(){
  saveFile(`${storageName}.bzw`, source);
}

/** Delete map from browser storage */
function deleteMap(){
  localStorage.removeItem(`map-${storageName}`);
  window.location.href = "/";
}

/** Add object to map using a user prompt */
function addObject(type?: string){
  if(!type){
    return;
  }

  if(type === "box"){
    map.objects.push(new bzw.objects.Box());
  }else if(type === "meshbox"){
    map.objects.push(new bzw.objects.MeshBox());
  }else if(type === "pyramid"){
    map.objects.push(new bzw.objects.Pyramid());
  }else if(type === "meshpyr"){
    map.objects.push(new bzw.objects.MeshPyramid());
  }else if(type === "base"){
    map.objects.push(new bzw.objects.Base());
  }else if(type === "zone"){
    map.objects.push(new bzw.objects.Zone());
  }else if(type === "physics"){
    map.objects.push(new bzw.objects.Physics());
  }else{
    return alert("Unsupported object type");
  }

  source = bzw.mapToBZW(map);
  _sourceChanged(false);

  setSelectedMapObject(map.objects.length - 1);
}
addObject();

/** Raw handler for textarea being changed */
function _sourceChanged(updateSelected = true){
  parseSource(updateSelected);
  updateMesh();
  localStorage.setItem(`map-${storageName}`, source);
}

let timeoutId = 0;
/** Smart handler for textarea being changed */
function sourceChanged(updateSelected = true){
  if(timeoutId){
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => _sourceChanged(updateSelected), EDITOR_CHANGE_TIMEOUT);
}

dom.bzwFile.addEventListener("change", () => {
  handleFile(dom.bzwFile.files);
});

let selectedMapObjectIndex = -1;
function setSelectedMapObject(newIndex: number){
  if(newIndex === selectedMapObjectIndex){
    return;
  }
  selectedMapObjectIndex = newIndex;

  if(selectedMapObjectIndex < 0){
    return;
  }

  const selectedMapObject = map.objects[selectedMapObjectIndex] as bzw.MapObject;
  if((selectedMapObject as any).position){
    renderer.axisPosition = (selectedMapObject as any).position;
  }else{
    renderer.axisPosition = [0, 0, 0];
  }

  dom.removeAllChildren(dom.panels.properties);

  // add element saying object type
  const typeElement = document.createElement("div");
  typeElement.innerText = `Type: ${capitalize(selectedMapObject.HEADER)}`;
  dom.panels.properties.appendChild(typeElement);

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
    nameElement.innerText = `${capitalize(property.split(/([A-Z])/g).map((value, i, array) => {
      if(value.length > 1 && i > 0){
        return `${array[i - 1]}${value}`;
      }

      return value;
    }).filter((value) => value.length !== 1).join(" "))}`;
    dom.panels.properties.appendChild(nameElement);

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
        source = bzw.mapToBZW(map);
        sourceChanged();
      });

      valueElement.appendChild(inputElement);
    };

    switch(typeof value){
      case "string": {
        createInputElement("text", value, (inputElement) => {
          (map.objects[selectedMapObjectIndex] as unknown as Record<string, string>)[property] = inputElement.value;
        });
      } break;
      case "number": {
        createInputElement("number", `${value}`, (inputElement) => {
          (map.objects[selectedMapObjectIndex] as unknown as Record<string, number>)[property] = bzw.parseNum(inputElement.value);
        });
      } break;
      case "boolean": {
        createInputElement("checkbox", value, (inputElement) => {
          (map.objects[selectedMapObjectIndex] as unknown as Record<string, boolean>)[property] = inputElement.checked;
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
            (map.objects[selectedMapObjectIndex] as unknown as Record<string, number[]>)[property] = [0, 0, 0, 1];
            source = bzw.mapToBZW(map);
            sourceChanged();

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
              (map.objects[selectedMapObjectIndex] as unknown as Record<string, number[]>)[property][valueIndex] = bzw.parseNum(inputElement.value);
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
                (map.objects[selectedMapObjectIndex] as unknown as Record<string, undefined>)[property] = undefined;
                source = bzw.mapToBZW(map);
                sourceChanged();

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

    dom.panels.properties.appendChild(valueElement);
  }

  for(const selected of dom.panels.objects.querySelectorAll<HTMLDivElement>(".selected")){
    selected.classList.remove("selected");
  }

  Array.from(dom.panels.objects.children)[selectedMapObjectIndex].classList.add("selected");
}

dom.panels.objects.addEventListener("click", (e: Event) => {
  const target = e.target as HTMLElement;
  if(!target || !target.parentElement || !target.parentElement.classList.contains("panel__content")){
    return;
  }

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
  if(e.keyCode === 68 && e.ctrlKey && e.shiftKey){ // Ctrl+Sift+D (delete file)
    e.preventDefault();
    deleteMap();
  }else if(e.keyCode === 68 && e.ctrlKey){ // Ctrl+D (download)
    e.preventDefault();
    saveMap();
  }else if(e.keyCode === 79 && e.ctrlKey){ // Ctrl+O (open file)
    e.preventDefault();
    dom.bzwFile.click();
  }else if(e.keyCode === 83 && e.ctrlKey){ // Ctrl+S (save)
    e.preventDefault();
    alert("WebBZW automatically saves your work! You can use Ctrl+D to download the file or Ctrl+C to copy the contents to your clipboard.")
  }else if(e.keyCode === 65 && e.altKey){ // Alt+A (add object)
    e.preventDefault();
    addObject(prompt("Type of object:") ?? undefined);
  }else if(e.keyCode === 82 && e.altKey){ // Alt+R (remove object)
    e.preventDefault();
    removeObject();
  }
};

document.addEventListener("copy", (e: ClipboardEvent) => {
  e.preventDefault();
  (e.clipboardData || (window as any).clipboardData as DataTransfer).setData("text/plain", source);
}, false);

document.addEventListener("paste", (e: ClipboardEvent) => {
  e.preventDefault();
  source = (e.clipboardData || (window as any).clipboardData as DataTransfer).getData("text");
  sourceChanged();
}, false);

document.addEventListener("DOMContentLoaded", () => {
  settings.load();
  _sourceChanged();
});

function parseSource(updateSelected = true){
  const oldSelected = map.objects[selectedMapObjectIndex]?.toString() ?? "";

  map = bzw.parse(source);

  dom.removeAllChildren(dom.panels.objects);

  for(const object of map.objects){
    const div = document.createElement("div");
    div.innerText = object.name || object.HEADER;
    dom.panels.objects.appendChild(div);
  }

  if(updateSelected && (map.objects[selectedMapObjectIndex]?.toString() ?? "") !== oldSelected){ // object has changed
    const index = parseInt(`${selectedMapObjectIndex}`); // deep clone
    selectedMapObjectIndex = -1;
    setSelectedMapObject(index);
  }

  // update map name
  const newStorageName = map.objects.find((object: bzw.MapObject) => object instanceof bzw.objects.World)?.name || storageName;
  if(newStorageName !== storageName){
    if(localStorage.getItem(`map-${newStorageName}`) && !confirm("You are about to overwrite an existing map - are you sure?")){
      const world = map.objects.find((object: bzw.MapObject) => object instanceof bzw.objects.World);
      if(world){
        world.name = storageName;
        source = bzw.mapToBZW(map);
        sourceChanged();

        const index = parseInt(`${selectedMapObjectIndex}`); // deep clone
        selectedMapObjectIndex = -1;
        setSelectedMapObject(index);
      }

      return;
    }

    localStorage.removeItem(`map-${storageName}`);
    history.replaceState(null, "", `#${window.encodeURI(newStorageName)}`);
    storageName = newStorageName;
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
  // FIXME: should be dynamically sorted based on viewport
  for(const object of [...map.objects].sort((a: any, b: any) => (a.color?.[3] ?? -1) > (b.color?.[3] ?? 1) ? 1 : -1)){
    object.buildMesh(mesh);
  }

  renderer.worldSize = map.worldSize;
  renderer.updateMesh(mesh);

  dom.statusBar.objects.innerText = `${map.objects.length} Objects`;
  dom.statusBar.vertices.innerText = `${mesh.indices.length} Vertices`;
}

/** Remove object from map */
function removeObject(){
  if(selectedMapObjectIndex < 1){
    return;
  }

  map.objects.splice(selectedMapObjectIndex, 1);

  source = bzw.mapToBZW(map);
  _sourceChanged(false);

  setSelectedMapObject(selectedMapObjectIndex - 1);
}
removeObject();
