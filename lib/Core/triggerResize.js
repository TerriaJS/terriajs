"use strict";

/**
 * Trigger a window resize event.
 */
function triggerResize() {
  try {
    window.dispatchEvent(new Event("resize"));
  } catch (e) {
    var evt = window.document.createEvent("UIEvents");
    evt.initUIEvent("resize", true, false, window, 0);
    window.dispatchEvent(evt);
  }
}

module.exports = triggerResize;
