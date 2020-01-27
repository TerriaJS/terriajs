// Use this file to install polyfills and configure packages.

// Poylfilling in Terria is done automatically in most cases by babel preset-env and corejs
// Extra polyfills should be added here when dependencies (transpiled to ES5, but using e.g. Symbol or Promsie) need them
import "core-js/features/symbol";
import "core-js/features/promise";
import "regenerator-runtime/runtime";
import "core-js/features/global-this";
import { configure } from "mobx";
import "../Models/i18n";

configure({
  computedRequiresReaction: true,
  enforceActions: "observed"
});
