/**
 * Trigger a window resize event.
 */
export default function triggerResize() {
  try {
    window.dispatchEvent(new Event("resize"));
  } catch (_e) {
    const evt = window.document.createEvent("UIEvents");
    evt.initUIEvent("resize", true, false, window, 0);
    window.dispatchEvent(evt);
  }
}
