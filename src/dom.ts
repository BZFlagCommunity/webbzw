export const canvas = document.querySelector("canvas") as HTMLCanvasElement;
export const bzwFile = document.querySelector("#bzw-file") as HTMLInputElement;

export const panels = {
  objects: document.querySelector("#objects > .panel__content") as HTMLDivElement,
  properties: document.querySelector("#properties > .panel__content") as HTMLDivElement,
};

export const statusBar = {
  objects: document.querySelector("#status--objects") as HTMLElement,
  vertices: document.querySelector("#status--vertices") as HTMLElement,
};

export const settings = {
  autoRotate: document.querySelector("#auto-rotate") as HTMLInputElement,
  showAxis: document.querySelector("#show-axis") as HTMLInputElement,
};

/** Remove all children from `target` element */
export function removeAllChildren(target: HTMLElement){
  while(target.lastChild){
    target.lastChild.remove();
  }
}
