import React from "react";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

export default function getReactElementFromContents(contents) {
  if (typeof contents === "string") {
    return contents;
  }
  const contentsIsFn = typeof contents === "function";
  const fnCalled = contentsIsFn ? contents() : undefined;
  return React.isValidElement(fnCalled)
    ? fnCalled
    : parseCustomMarkdownToReact(contents);
}
