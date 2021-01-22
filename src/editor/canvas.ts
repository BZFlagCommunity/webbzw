import * as dom from "../dom/mod.ts";

const canvasParent = dom.canvas.parentElement;

window.addEventListener("resize", () => {
  if(!canvasParent){
    return;
  }
  const parentWidth = canvasParent.getBoundingClientRect().width;
  const minWidth = parentWidth / 2;
  const maxWidth = parentWidth - (parentWidth / 4);

  let newRightWidth = dom.canvas.width;
  if(newRightWidth < minWidth){
    newRightWidth = minWidth;
  }else if(newRightWidth > maxWidth){
    newRightWidth = maxWidth;
  }

  dom.canvas.width = newRightWidth;
});
