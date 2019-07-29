// This file is loaded by TerriaMap's entry.js prior to loading index.js.
// It is mostly useful for installing polyfills.
import "core-js/features/symbol";
import "regenerator-runtime/runtime";
import "core-js/features/global-this";
import { configure } from "mobx";

configure({
  computedRequiresReaction: true,
  enforceActions: "observed"
});
