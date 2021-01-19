import {highlightHtml} from "./core.ts";

const lineNumbersElement = document.querySelector(".line-numbers") as HTMLElement;

/** Find and delete highlight element */
export function deleteHighlightElement(editor: HTMLElement): void{
  const highlighter = editor.children.item(1);
  if(highlighter){
    highlighter.remove();
  }
};

/** Run highlighter */
export function highlight(editor: HTMLElement, textarea: HTMLTextAreaElement, source?: string): void{
  const lines = textarea.value.split("\n");
  let sourceLines = source ? source.split("\n").length : lines.length;
  const reset = Math.abs(sourceLines - lines.length) > 1;

  // if multiple lines changes brute force update - FIXME: this is a very bad hack
  if(reset){
    deleteHighlightElement(editor);
  }

  // line numbers - FIXME: this should not be rebuilt every time
  setTimeout(() => {
    while(lineNumbersElement.lastChild){
      lineNumbersElement.lastChild.remove();
    }

    for(let i = 0; i < lines.length; i++){
      const lineNumberElement = document.createElement("span");
      lineNumberElement.innerText = `${i + 1}`;
      lineNumbersElement.appendChild(lineNumberElement);
    }
  });

  if(!editor.children.item(1)){
    const elem = document.createElement("pre");
    if(!elem){
      console.error("highlight element could not be created");
      return;
    }
    elem.classList.add("highlight");

    const html = (highlightHtml(textarea.value) + "\n").split("\n");

    for(const lineNumber in html){
      const line = document.createElement("div");
      line.innerHTML = html[lineNumber];
      elem.appendChild(line);
    }

    editor.appendChild(elem);

    elem.scrollTop = textarea.scrollTop;
    elem.scrollLeft = textarea.scrollLeft;

    lineNumbersElement.scrollTop = textarea.scrollTop;
  }

  if(reset){
    return;
  }

  const elem = editor.children.item(1) as HTMLElement;
  if(!elem){
    return;
  }

  const selectionStart = textarea.selectionStart;
  const currentLineNumber = (sourceLines === lines.length ? textarea.value : source ?? "").substr(0, selectionStart).split("\n").length - 1;

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
