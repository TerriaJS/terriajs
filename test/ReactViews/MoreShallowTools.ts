import type { ReactElement } from "react";
import { createRenderer } from "react-test-renderer/shallow";

export function getRenderedRenderer(jsx: ReactElement) {
  const renderer = createRenderer();
  renderer.render(jsx);
  return renderer;
}

export function getMountedInstance(jsx: ReactElement) {
  const renderer = getRenderedRenderer(jsx);
  return renderer.getMountedInstance();
}
