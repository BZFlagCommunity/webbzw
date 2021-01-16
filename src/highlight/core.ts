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
  "meshbox",
  "meshpyr",
  "mesh",
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
const HIGHLIGHT_HEADERS_REGEX = new RegExp(`^([ \t]*)(${HIGHLIGHT_HEADERS.join("|")})`, "gmi");

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
const HIGHLIGHT_KEYWORDS_REGEX = new RegExp(`^([ \t]*)(${HIGHLIGHT_KEYWORDS.join("|")})`, "gmi");

const highlightSpan = (type: string): string => `<span class="${type}">$1</span>`;
const highlightWord = (type: string): string => `$1<span class="${type}">$2</span>`;

export const highlightHtml = (text: string): string =>
  text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([-\.*/"=]+?)/g, highlightSpan("symbol"))
    .replace(/(#.*?$)/gm, highlightSpan("comment"))
    .replace(/([0-9]+)/g, highlightSpan("number"))
    .replace(HIGHLIGHT_HEADERS_REGEX, highlightWord("header"))
    .replace(HIGHLIGHT_KEYWORDS_REGEX, highlightWord("keyword"))
;