const HEADERS = [
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
  "end",
];
const HEADERS_REGEX = new RegExp(`^([ \t]*)(${HEADERS.join("|")})$`, "gm");

const KEYWORDS = [
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
  "freeCtfSpawns",
  "zoneflag",
  "flag",
  "type",
];
const KEYWORDS_REGEX = new RegExp(`^([ \t]*)(${KEYWORDS.join("|")})`, "gm");

const FLAGS = [
  "good",
  "bad",
  "R*",
  "G*",
  "B*",
  "P*",
  "A",
  "BU",
  "CS",
  "CL",
  "GM",
  "G",
  "IB",
  "ID",
  "JP",
  "LG",
  "L",
  "MG",
  "MQ",
  "N",
  "OO",
  "PZ",
  "QT",
  "F",
  "R",
  "SE",
  "SH",
  "SW",
  "ST",
  "SR",
  "SB",
  "TH",
  "T",
  "US",
  "V",
  "WG",
  "BY",
  "B",
  "CB",
  "FO",
  "JM",
  "LT",
  "M",
  "NJ",
  "O",
  "RC",
  "RO",
  "RT",
  "TR",
  "WA",
];
const FLAGS_REGEX = new RegExp(`^([ \t]*(zoneflag|flag|type) )(${FLAGS.join("|").replace(/\*/g, "\\*")})`, "gm");

const highlightSpan = (type: string): string => `<span class="${type}">$1</span>`;
const highlightWord = (type: string, first = 1, second = 2): string => `$${first}<span class="${type}">$${second}</span>`;

export const highlightHtml = (text: string): string =>
  text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([-\.*/"=]+?)/g, highlightSpan("symbol"))
    .replace(/(#.*?$)/gm, highlightSpan("comment"))
    .replace(/([0-9]+)/g, highlightSpan("number"))
    .replace(HEADERS_REGEX, highlightWord("header"))
    .replace(KEYWORDS_REGEX, highlightWord("keyword"))
    .replace(FLAGS_REGEX, highlightWord("flag", undefined, 3))
;
