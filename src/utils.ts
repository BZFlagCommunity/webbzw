/** Smartly get coordinate for input */
export function getCoord(e: any, coord: "X" | "Y"): number{
  return e.touches ? e.touches[0][`page${coord}`] : e[`page${coord}`];
}

/** Save map to device */
export function saveFile(fileName: string, text: string){
  const blob = new Blob([text], {type: "text/plain"});

  const link = document.createElement("a");

  link.download = fileName;
  link.href = window.URL.createObjectURL(blob);

  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Apply color theme */
export function colorThemeChanged(){
  document.documentElement.setAttribute("data-theme", localStorage.getItem("colorTheme") ?? "default");
}
