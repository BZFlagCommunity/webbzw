import * as dom from "../dom/mod.ts";

/** Toggle current line as a comment */
export function toggleComment(){
  dom.textarea.focus();

  let selectionStart = dom.textarea.selectionStart;
  const currentLineNumber = dom.textarea.value.substr(0, selectionStart).split("\n").length - 1;
  const lines = dom.textarea.value.split("\n");

  if(lines[currentLineNumber].startsWith("#")){ // remove comment
    lines[currentLineNumber] = lines[currentLineNumber].substr(1);
    selectionStart--;
  }else{ // add comment
    lines[currentLineNumber] = "#" + lines[currentLineNumber];
    selectionStart++;
  }

  dom.textarea.value = lines.join("\n");
  dom.textarea.selectionEnd = selectionStart;
}
