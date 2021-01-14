import {highlightHtml} from "./core.ts";

export const deleteHighlightElement = (editor: HTMLElement): void => {
  const highlighter = editor.children.item(1);
  if(highlighter){
    highlighter.remove();
  }
};

export const highlight = (editor: HTMLElement, textarea: HTMLTextAreaElement): void => {
  console.time("delete old element");
  deleteHighlightElement(editor);
  console.timeEnd("delete old element");

  console.time("create new element");
  const elem = document.createElement("pre");
  if(!elem){
    console.error("highlight element could not be created");
    return;
  }
  elem.classList.add("highlight");
  console.timeEnd("create new element");

  console.time("build html");
  const html = highlightHtml(textarea.value) + "\n";
  console.timeEnd("build html");

  console.time("set html");
  elem.innerHTML = html;
  console.timeEnd("set html");

  console.time("add element to dom");
  editor.appendChild(elem);
  console.timeEnd("add element to dom");

  console.time("set element scroll");
  elem.scrollTop = textarea.scrollTop;
  elem.scrollLeft = textarea.scrollLeft;
  console.timeEnd("set element scroll");
};
