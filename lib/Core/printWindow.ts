import TerriaError from "./TerriaError";

import i18next from "i18next";

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

    const timeout = setTimeout(function () {
      reject(
        new TerriaError({
          title: i18next.t("core.printWindow.errorTitle"),
          message: i18next.t("core.printWindow.errorMessage")
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
          console.log(i18next.t("core.printWindow.printMediaStart"));
          ++printInProgressCount;
        } else {
          console.log(i18next.t("core.printWindow.printMediaEnd"));
          --printInProgressCount;
          resolveIfZero();
        }
      });
    }

    windowToPrint.onbeforeprint = () => {
      cancelTimeout();
      console.log(i18next.t("core.printWindow.onbeforeprint"));
      ++printInProgressCount;
    };
    windowToPrint.onafterprint = () => {
      cancelTimeout();
      console.log(i18next.t("core.printWindow.onafterprint"));
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
