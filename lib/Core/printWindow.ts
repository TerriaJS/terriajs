import TerriaError from "./TerriaError";

/**
 * Tells the web browser to print a given window, which my be an iframe window, and
 * returns a promise that resolves when printing is safely over so that, for example
 * the window can be removed.
 * @param windowToPrint The window to print.
 * @returns A promise that resolves when printing is safely over. The promise is rejected if
 *                    there is no indication that the browser's print
 */
export default function printWindow(windowToPrint: Window): Promise<void> {
  const deferred = new Promise<void>((resolve, reject) => {
    let printInProgressCount = 0;

    const timeout = setTimeout(function() {
      reject(
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
        resolve();
      }
    }

    if (windowToPrint.matchMedia) {
      windowToPrint.matchMedia("print").addListener((evt: any) => {
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

    windowToPrint.onbeforeprint = () => {
      cancelTimeout();
      console.log("onbeforeprint");
      ++printInProgressCount;
    };
    windowToPrint.onafterprint = () => {
      cancelTimeout();
      console.log("onafterprint");
      --printInProgressCount;
      resolveIfZero();
    };

    // First try printing with execCommand, because, in IE11, `printWindow.print()`
    // prints the entire page instead of just the embedded iframe (if the window
    // is an iframe, anyway).
    const result = windowToPrint.document.execCommand("print", true, undefined);
    if (!result) {
      windowToPrint.print();
    }
  });

  return deferred;
}

module.exports = printWindow;
