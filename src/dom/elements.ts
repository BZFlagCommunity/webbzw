export const textarea = document.querySelector(".editor textarea") as HTMLTextAreaElement;
export const editor = document.querySelector(".editor") as HTMLDivElement;
export const canvas = document.querySelector("canvas") as HTMLCanvasElement;
export const lineNumbersElement = document.querySelector(".line-numbers") as HTMLElement;
export const bzwFile = document.querySelector("#bzw-file") as HTMLInputElement;

export const statusBar = {
  objects: document.querySelector("#objects") as HTMLElement,
  vertices: document.querySelector("#vertices") as HTMLElement,
};

export const settings = {
  autoRotate: document.querySelector("#auto-rotate") as HTMLInputElement,
  showAxis: document.querySelector("#show-axis") as HTMLInputElement,
  syntaxHighlighting: document.querySelector("#syntax-highlighting") as HTMLInputElement
};
