import {elements} from "../dom/mod.ts";

const canvasParent = elements.canvas.parentElement;

window.addEventListener("resize", () => {
  if(!canvasParent){
    return;
  }
  const parentWidth = canvasParent.getBoundingClientRect().width;
  const minWidth = parentWidth / 2;
  const maxWidth = parentWidth - (parentWidth / 4);

  let newRightWidth = elements.canvas.width;
  if(newRightWidth < minWidth){
    newRightWidth = minWidth;
  }else if(newRightWidth > maxWidth){
    newRightWidth = maxWidth;
  }

  elements.canvas.width = newRightWidth;
});
