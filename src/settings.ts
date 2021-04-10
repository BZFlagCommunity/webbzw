import * as dom from "./dom.ts";

/** Load all settings from `localStorage` */
export function load(){
  dom.settings.autoRotate.checked = localStorage.getItem("autoRotate") === "true";
  dom.settings.showAxis.checked = localStorage.getItem("showAxis") !== "false";
  colorThemeChanged();
}

/** Apply color theme */
function colorThemeChanged(){
  document.documentElement.setAttribute("data-theme", localStorage.getItem("colorTheme") ?? "default");
}

function setColorTheme(e?: Event){
  if(!e){
    return;
  }

  const target = (e.target as HTMLElement);

  // ignore if we clicked the menu element
  if(target.classList.contains("menu")){
    return;
  }

  localStorage.setItem("colorTheme", target.innerText.toLowerCase().replace(/ /g, "-"));
  colorThemeChanged();
}
setColorTheme(); // HACK: this is so the function is not removed

dom.settings.autoRotate.addEventListener("change", () => {
  localStorage.setItem("autoRotate", dom.settings.autoRotate.checked ? "true" : "false");
});

dom.settings.showAxis.addEventListener("change", () => {
  localStorage.setItem("showAxis", dom.settings.showAxis.checked ? "true" : "false");
});
