const panels = JSON.parse(localStorage.getItem("panels") ?? "{}");

for(const panel of document.querySelectorAll<HTMLElement>(".panel")){
  const header = panel.querySelector<HTMLElement>(".panel__header");
  if(!header){
    continue;
  }

  header.draggable = true;

  header.addEventListener("dragstart", (e: DragEvent) => {
    e.dataTransfer?.setData("text/plain", panel.id);
  }, false);

  panel.addEventListener("dragenter", (e: DragEvent) => {
    e.preventDefault();
    panel.style.borderColor = "#FFF";
  }, false);

  panel.addEventListener("dragover", (e: DragEvent) => {
    e.preventDefault();
    panel.style.borderColor = "#FFF";
  }, false);

  panel.addEventListener("dragleave", (e: DragEvent) => {
    e.preventDefault();
    panel.style.borderColor = "";
  }, false);

  panel.addEventListener("drop", (e: DragEvent) => {
    if(e.dataTransfer?.files.length ?? 0 > 0){
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    panel.style.borderColor = "";

    const id = e.dataTransfer?.getData("text/plain");

    // ignore self
    if(!id || id === panel.id){
      return;
    }

    const otherPanel = document.querySelector<HTMLElement>(`#${id}`);
    if(!otherPanel){
      return;
    }

    const panelGridArea = window.getComputedStyle(panel).gridArea;
    const otherPanelGridArea = window.getComputedStyle(otherPanel).gridArea;

    panel.style.gridArea = otherPanelGridArea;
    otherPanel.style.gridArea = panelGridArea;

    // resize canvas if needed
    if(panel.id === "preview" || otherPanel.id === "preview"){
      const canvas = document.querySelector("canvas");

      if(canvas){
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    panels[panel.id] = panel.style.gridArea;
    panels[otherPanel.id] = otherPanel.style.gridArea;
    localStorage.setItem("panels", JSON.stringify(panels));
  }, false);

  if(panels[panel.id]){
    panel.style.gridArea = panels[panel.id];
  }
}
