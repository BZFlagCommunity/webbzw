import {highlightHtml} from "./core.ts";

import * as dom from "../dom/mod.ts";

/** Find and delete highlight element */
export function deleteHighlightElement(): void{
  const highlighter = dom.editor.children.item(1);
  if(highlighter){
    highlighter.remove();
  }
};

/** Run highlighter */
export function highlight(source?: string): void{
  const lines = dom.textarea.value.split("\n");
  let sourceLines = source ? source.split("\n").length : lines.length;
  const reset = Math.abs(sourceLines - lines.length) > 1;

  // if multiple lines changes brute force update
  // HACK this should not be brute-forced
  if(reset){
    deleteHighlightElement();
  }

  if(!dom.editor.children.item(1)){
    const highlightElement = document.createElement("pre");
    if(!highlightElement){
      console.error("highlight element could not be created");
      return;
    }
    highlightElement.classList.add("highlight");

    const html = (highlightHtml(dom.textarea.value) + "\n").split("\n");

    for(const lineNumber in html){
      const line = document.createElement("div");
      line.innerHTML = html[lineNumber];
      highlightElement.appendChild(line);
    }

    dom.editor.appendChild(highlightElement);

    highlightElement.scrollTop = dom.textarea.scrollTop;
    highlightElement.scrollLeft = dom.textarea.scrollLeft;
  }

  if(reset){
    return;
  }

  const elem = dom.editor.children.item(1) as HTMLElement;
  if(!elem){
    return;
  }

  const selectionStart = dom.textarea.selectionStart;
  const currentLineNumber = (sourceLines === lines.length ? dom.textarea.value : source ?? "").substr(0, selectionStart).split("\n").length - 1;

  const html = highlightHtml(lines[currentLineNumber]);

  if(sourceLines < lines.length){ // line added
    const newLine = document.createElement("div");
    newLine.innerHTML = highlightHtml(lines[currentLineNumber + 1]);
    elem.insertBefore(newLine, elem.children[currentLineNumber + 1]);
  }else if(sourceLines > lines.length){ // line deleted
    elem.removeChild(elem.children[currentLineNumber]);
  }

  elem.children[currentLineNumber].innerHTML = html;
}
