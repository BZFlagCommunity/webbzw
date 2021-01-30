import "./resizer.ts";

export const textarea = document.querySelector(".editor textarea") as HTMLTextAreaElement;
export const editor = document.querySelector(".editor") as HTMLDivElement;
export const canvas = document.querySelector("canvas") as HTMLCanvasElement;
export const lineNumbersElement = document.querySelector(".line-numbers") as HTMLElement;
export const bzwFile = document.querySelector("#bzw-file") as HTMLInputElement;

export const tree = {
  root: document.querySelector(".tree") as HTMLDivElement,
  objects: document.querySelector(".tree > .objects") as HTMLDivElement,
  properties: document.querySelector(".tree > .properties") as HTMLDivElement,
};

export const statusBar = {
  objects: document.querySelector("#objects") as HTMLElement,
  vertices: document.querySelector("#vertices") as HTMLElement,
};

export const settings = {
  autoRotate: document.querySelector("#auto-rotate") as HTMLInputElement,
  showAxis: document.querySelector("#show-axis") as HTMLInputElement,
  syntaxHighlighting: document.querySelector("#syntax-highlighting") as HTMLInputElement
};

/** Remove all children from `target` element */
export function removeAllChildren(target: HTMLElement){
  while(target.lastChild){
    target.lastChild.remove();
  }
}

/** Update line numbers to match source */
export function updateLineNumbers(){
  lineNumbersElement.innerHTML = [...Array(textarea.value.split("\n").length).keys()].map((i) => i + 1).join("\n");
  lineNumbersElement.scrollTop = textarea.scrollTop;
}
