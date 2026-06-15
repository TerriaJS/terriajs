// Use this file to install polyfills and configure packages.

import { configure } from "mobx";

configure({
  computedRequiresReaction: true,
  enforceActions: "observed"
});
