import {highlightHtml} from "./highlight/core.ts";

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

  elem.innerHTML = highlightHtml(textarea.value);

  editor.appendChild(elem);
  elem.scrollTop = textarea.scrollTop;
  elem.scrollLeft = textarea.scrollLeft;
};
