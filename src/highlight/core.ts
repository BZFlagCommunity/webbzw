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

export const highlightHtml = (text: string): string =>
  text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;")
    .replace(/([-\.*/"=]+?)/g, highlightSpan("symbol"))
    .replace(/(#.*?$)/gm, highlightSpan("comment"))
    .replace(/([0-9]+)/g, highlightSpan("number"))
    .replace(HIGHLIGHT_HEADERS_REGEX, highlightSpan("header"))
    .replace(HIGHLIGHT_KEYWORDS_REGEX, highlightSpan("keyword"))
    .replace(/\n/g, "<br>")
;
