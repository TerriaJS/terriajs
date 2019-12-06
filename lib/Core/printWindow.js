const when = require("terriajs-cesium/Source/ThirdParty/when").default;
const TerriaError = require("./TerriaError");

/**
 * Tells the web browser to print a given window, which my be an iframe window, and
 * returns a promise that resolves when printing is safely over so that, for example
 * the window can be removed.
 * @param {Window} windowToPrint The window to print.
 * @returns {Promise} A promise that resolves when printing is safely over. The prommise is rejected if
 *                    there is no indication that the browser's print
 */
function printWindow(windowToPrint) {
  const deferred = when.defer();
  let printInProgressCount = 0;

  const timeout = setTimeout(function() {
    deferred.reject(
      new TerriaError({
        title: "Error printing",
        message:
          "Printing did not start within 10 seconds. Maybe this web browser does not support printing?"
      })
    );
  }, 10000);

  function cancelTimeout() {
    clearTimeout(timeout);
  }

  function resolveIfZero() {
    if (printInProgressCount <= 0) {
      deferred.resolve();
    }
  }

  if (windowToPrint.matchMedia) {
    windowToPrint.matchMedia("print").addListener(function(evt) {
      cancelTimeout();
      if (evt.matches) {
        console.log("print media start");
        ++printInProgressCount;
      } else {
        console.log("print media end");
        --printInProgressCount;
        resolveIfZero();
      }
    });
  }

  windowToPrint.onbeforeprint = function() {
    cancelTimeout();
    console.log("onbeforeprint");
    ++printInProgressCount;
  };
  windowToPrint.onafterprint = function() {
    cancelTimeout();
    console.log("onafterprint");
    --printInProgressCount;
    resolveIfZero();
  };

  // First try printing with execCommand, because, in IE11, `printWindow.print()`
  // prints the entire page instead of just the embedded iframe (if the window
  // is an iframe, anyway).
  const result = windowToPrint.document.execCommand("print", true, null);
  if (!result) {
    windowToPrint.print();
  }

  return deferred.promise;
}

module.exports = printWindow;
