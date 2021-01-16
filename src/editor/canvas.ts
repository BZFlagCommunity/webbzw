const canvas = document.querySelector("canvas") as HTMLCanvasElement;
const canvasParent = canvas.parentElement;

window.addEventListener("resize", () => {
  if(!canvasParent){
    return;
  }
  const parentWidth = canvasParent.getBoundingClientRect().width;
  const minWidth = parentWidth / 2;
  const maxWidth = parentWidth - (parentWidth / 4);

  let newRightWidth = canvas.width;
  if(newRightWidth < minWidth){
    newRightWidth = minWidth;
  }else if(newRightWidth > maxWidth){
    newRightWidth = maxWidth;
  }

  canvas.width = newRightWidth;
});
