import {highlightHtml} from "./core.ts";

import {elements} from "../dom/mod.ts";

/** Find and delete highlight element */
export function deleteHighlightElement(): void{
  const highlighter = elements.editor.children.item(1);
  if(highlighter){
    highlighter.remove();
  }
};

/** Run highlighter */
export function highlight(source?: string): void{
  const lines = elements.textarea.value.split("\n");
  let sourceLines = source ? source.split("\n").length : lines.length;
  const reset = Math.abs(sourceLines - lines.length) > 1;

  // if multiple lines changes brute force update - FIXME: this is a very bad hack
  if(reset){
    deleteHighlightElement();
  }

  if(!elements.editor.children.item(1)){
    const elem = document.createElement("pre");
    if(!elem){
      console.error("highlight element could not be created");
      return;
    }
    elem.classList.add("highlight");

    const html = (highlightHtml(elements.textarea.value) + "\n").split("\n");

    for(const lineNumber in html){
      const line = document.createElement("div");
      line.innerHTML = html[lineNumber];
      elem.appendChild(line);
    }

    elements.editor.appendChild(elem);

    elem.scrollTop = elements.textarea.scrollTop;
    elem.scrollLeft = elements.textarea.scrollLeft;
  }

  if(reset){
    return;
  }

  const elem = elements.editor.children.item(1) as HTMLElement;
  if(!elem){
    return;
  }

  const selectionStart = elements.textarea.selectionStart;
  const currentLineNumber = (sourceLines === lines.length ? elements.textarea.value : source ?? "").substr(0, selectionStart).split("\n").length - 1;

  const html = highlightHtml(lines[currentLineNumber]);

  if(sourceLines < lines.length){ // line added
    const newLine = document.createElement("div");
    newLine.innerHTML = highlightHtml(lines[currentLineNumber + 1]);
    elem.insertBefore(newLine, elem.children[currentLineNumber + 1]);
  }else if(sourceLines > lines.length){ // line deleted
    elem.removeChild(elem.children[currentLineNumber]);
  }

  elem.children[currentLineNumber].innerHTML = html;
};
