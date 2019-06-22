/**
 * Loads a polyfill suite from polyfill.io and then calls the provided
 * callback when it is ready
 */
function polyfill(callback) {
  const newScript = document.createElement("script");
  newScript.src = polyfill.url;
  newScript.onload = callback;
  document.head.appendChild(newScript);
}

// If you change this, also change the script src in SpecRunner.html.
polyfill.url = "https://polyfill.io/v3/polyfill.min.js?features=default%2Ces2015%2Ces2016%2Ces2017%2CPromise.prototype.finally";

module.exports = polyfill;
