// resizing bars
for(const resizer of document.querySelectorAll<HTMLElement>(".resizer")){
  const parent = resizer.parentElement;
  const leftSide = resizer.previousElementSibling as HTMLElement;
  const rightSide = resizer.nextElementSibling as HTMLCanvasElement;

  // mouse position
  let x = 0;
  // let y = 0;

  let rightWidth = 0;

  const mouseDownHandler = (e: MouseEvent) => {
    x = e.clientX;
    // y = e.clientY;
    rightWidth = rightSide.width;

    resizer.style.cursor = "col-resize";
    document.body.style.cursor = "col-resize";

    leftSide.style.userSelect = "none";
    leftSide.style.pointerEvents = "none";

    rightSide.style.userSelect = "none";
    rightSide.style.pointerEvents = "none";

    // attach the listeners to the document
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    if(!parent){
      return;
    }

    const dx = e.clientX - x;
    // const dy = e.clientY - y;

    const parentWidth = parent.getBoundingClientRect().width;
    const minWidth = parentWidth / 2;
    const maxWidth = parentWidth - (parentWidth / 4);

    let newRightWidth = (rightWidth - dx);
    if(newRightWidth < minWidth){
      newRightWidth = minWidth;
    }else if(newRightWidth > maxWidth){
      newRightWidth = maxWidth;
    }

    rightSide.width = newRightWidth;
  };

  const mouseUpHandler = function() {
    resizer.style.removeProperty("cursor");
    document.body.style.removeProperty("cursor");

    leftSide.style.removeProperty("user-select");
    leftSide.style.removeProperty("pointer-events");

    rightSide.style.removeProperty("user-select");
    rightSide.style.removeProperty("pointer-events");

    // detached the handlers
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
  };

  resizer.addEventListener("mousedown", mouseDownHandler);
}
