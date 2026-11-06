// The order of the cascade layers: the design system's, then the new UI's. The
// first @layer a page meets fixes it, and a bundler may load the stylesheets
// in any order (webpack puts node_modules' CSS in a chunk of its own, loaded
// first), so the order goes first in the page, before any stylesheet
export const LAYER_ORDER =
  "@layer terria-ds.tokens, terria-ds.reset, terria-ds.base, terria-ds.components, terria-ds.utilities, tjs.components, tjs.overrides;";

if (
  typeof document !== "undefined" &&
  !document.querySelector("style[data-tjs-layer-order]")
) {
  const style = document.createElement("style");
  style.dataset.tjsLayerOrder = "";
  style.textContent = LAYER_ORDER;
  document.head.prepend(style);
}
