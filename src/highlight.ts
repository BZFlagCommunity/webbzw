const HIGHLIGHT_HEADERS = [
  "world",
  "options",
  "waterLevel",
  "dynamicColor",
  "textureMatrix",
  "material",
  "transform",
  "physics",
  "arc",
  "base",
  "box",
  "cone",
  "define",
  "group",
  "link",
  "mesh",
  "meshbox",
  "meshpyr",
  "pyramid",
  "sphere",
  "teleporter",
  "tetra",
  "weapon",
  "zone",
  "face",
  "endface",
  "enddef",
  "drawInfo",
  "lod",
  "end"
];
const HIGHLIGHT_HEADERS_REGEX = new RegExp(`(${HIGHLIGHT_HEADERS.join("|")})`, "gmi");

const HIGHLIGHT_KEYWORDS = [
  "position",
  "size",
  "shift",
  "rotation",
  "color",
  "name",
  "flagHeight",
  "from",
  "to",
  "noWalls",
  "freeCtfSpawns"
];
const HIGHLIGHT_KEYWORDS_REGEX = new RegExp(`(${HIGHLIGHT_KEYWORDS.join("|")})`, "gmi");

const highlightSpan = (type: string): string => `<span class="${type}">$1</span>`;

export const deleteHighlightElement = (editor: HTMLElement): void => {
  const highlighter = editor.children.item(1);
  if(highlighter){
    highlighter.remove();
  }
};

export const highlight = (editor: HTMLElement): void => {
  deleteHighlightElement(editor);

  const textarea = editor.querySelector("textarea") as HTMLTextAreaElement;

  const elem = document.createElement("pre");
  if(!elem){
    console.error("highlight element could not be created");
    return;
  }
  elem.classList.add("highlight");

  elem.innerHTML = textarea.value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;")
    .replace(/([-\.*/"=]+?)/gi, highlightSpan("symbol"))
    .replace(/(#.*?$)/gmi, highlightSpan("comment"))
    .replace(/([0-9]+)/gi, highlightSpan("number"))
    .replace(HIGHLIGHT_HEADERS_REGEX, highlightSpan("header"))
    .replace(HIGHLIGHT_KEYWORDS_REGEX, highlightSpan("keyword"))
    .replace(/\n/gi, "<br>");

  editor.appendChild(elem);
  elem.scrollTop = textarea.scrollTop;
  elem.scrollLeft = textarea.scrollLeft;
};
