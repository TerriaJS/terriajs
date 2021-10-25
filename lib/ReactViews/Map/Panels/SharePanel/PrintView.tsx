import { formatDateTime } from "../../../BottomDock/Timeline/DateFormats";
import Description from "../../../Preview/Description";
import FeatureInfoPanel from "../../../FeatureInfo/FeatureInfoPanel";
import Legend from "../../../Workbench/Controls/Legend";
import React from "react";
import ReactDOM from "react-dom";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";

interface Props {
  terria: Terria;
  viewState: ViewState;
  window: Window;
  readyCallback: (window: Window) => void;
}

interface State {
  mapImageDataUrl: string | undefined;
  ready: boolean;
  printingStarted: boolean;
  isCheckingForImages: boolean;
}

interface CreateOptions {
  terria: Terria;
  viewState: ViewState;
  printWindow: Window;
  readyCallback: (printWindow: Window) => void;
  closeCallback: (printWindow: Window) => void;
}

class PrintView extends React.Component<Props, State> {
  printWindowIntervalId: number | undefined;
  mainWindowIntervalId: number | undefined;
  mainWindow: Window;
  printWindow: Window;

  constructor(props: Props) {
    super(props);
    this.state = {
      mapImageDataUrl: undefined,
      ready: false,
      printingStarted: false,
      isCheckingForImages: true
    };

    this.mainWindow = window;
    this.printWindow = props.window;
  }

  componentDidMount() {
    return this.props.terria.currentViewer
      .captureScreenshot()
      .then(mapImageDataUrl => {
        // We need to periodically check whether all images are loaded.
        // We can theoretically do that either with a setInterval on the original TerriaJS window,
        // or on the print view window. But:
        //    * Chrome (as of v66.0.3359.139 anyway) seems to aggressively suspend setInterval calls in background
        // tabs, so only a setInterval on the print view window works reliably.
        //    * Internet Explorer 11 does not seem to allow a cross-window setInterval call, so only a setInterval
        // on the original TerriaJS window works reliably.
        // So, we'll do both.

        const printWindow = this.props.window;
        const mainWindow = window;

        this.printWindowIntervalId = printWindow.setInterval(
          this.checkForImagesReady,
          200
        );
        this.mainWindowIntervalId = mainWindow.setInterval(
          this.checkForImagesReady,
          200
        );

        this.setState({
          mapImageDataUrl: mapImageDataUrl
        });
      });
  }

  componentWillUnmount() {
    this.stopCheckingForImages();
  }

  componentDidUpdate() {
    if (this.state.ready && !this.state.printingStarted) {
      if (this.props.readyCallback) {
        this.props.readyCallback(this.props.window);
      }
      this.setState({
        printingStarted: true
      });
    }
  }

  _stopCheckingForImages() {
    this.printWindow.clearInterval(this.printWindowIntervalId);
    this.mainWindow.clearInterval(this.mainWindowIntervalId);
  }

  stopCheckingForImages() {
    if (this._stopCheckingForImages) {
      this._stopCheckingForImages();
    }
  }

  checkForImagesReady() {
    if (this.state.ready) {
      return;
    }

    const imageTags = this.props.window.document.getElementsByTagName("img");
    if (imageTags.length === 0) {
      return;
    }

    let allImagesReady = true;
    for (let i = 0; allImagesReady && i < imageTags.length; ++i) {
      allImagesReady = imageTags[i].complete;
    }

    if (allImagesReady) {
      this.stopCheckingForImages();
      this.setState({
        ready: allImagesReady
      });
    }
  }

  render() {
    if (!this.state.mapImageDataUrl) {
      return <div>Creating print view...</div>;
    }

    return (
      <div>
        <p>
          <img
            className="map-image"
            src={this.state.mapImageDataUrl}
            alt="Map snapshot"
          />
        </p>
        <h1>Legends</h1>
        {this.props.terria.workbench.items.map(this.renderLegend)}
        {this.renderFeatureInfo()}
        <h1>Dataset Details</h1>
        {this.props.terria.workbench.items.map(this.renderDetails)}
        <h1>Map Credits</h1>
        {/* TODO: We don't have a way of getting credits yet*/}
        {this.props.terria.configParameters.printDisclaimer ? (
          <>
            <h1>Print Disclaimer</h1>
            <p>{this.props.terria.configParameters.printDisclaimer.text}</p>
          </>
        ) : null}
      </div>
    );
  }

  renderLegend(catalogItem: any) {
    if (!catalogItem.isMappable) {
      return null;
    }

    return (
      <div key={catalogItem.uniqueId} className="layer-legends">
        <div className="layer-title">{catalogItem.name}</div>
        {catalogItem.discreteTime && (
          <div className="layer-time">
            Time: {formatDateTime(catalogItem.discreteTime)}
          </div>
        )}
        <Legend forPrint={true} item={catalogItem} />
      </div>
    );
  }

  renderDetails(catalogItem: any) {
    if (!catalogItem.isMappable) {
      return null;
    }

    const nowViewingItem = catalogItem.nowViewingCatalogItem || catalogItem;
    return (
      <div key={catalogItem.uniqueId} className="layer-details">
        <h2>{catalogItem.name}</h2>
        <Description item={nowViewingItem} printView={true} />
      </div>
    );
  }

  renderFeatureInfo() {
    if (
      !this.props.viewState.featureInfoPanelIsVisible ||
      !this.props.terria.pickedFeatures ||
      !this.props.terria.pickedFeatures.features ||
      this.props.terria.pickedFeatures.features.length === 0
    ) {
      return null;
    }

    return (
      <div className="feature-info">
        <h1>Feature Information</h1>
        <FeatureInfoPanel
          terria={this.props.terria}
          viewState={this.props.viewState}
          printView={true}
        />
      </div>
    );
  }

  /**
   * Creates a new printable view.
   *
   * @param {Terria} options.terria The Terria instance.
   * @param {ViewState} options.viewState The terria ViewState instance.
   * @param {Window} [options.printWindow] The window in which to create the print view. This is usually a new window created with
   *                 `window.open()` or an iframe's `contentWindow`. If undefined, a new window (tab) will be created.
   * @param {Function} [options.readyCallback] A function that is called when the print view is ready to be used. The function is
   *                   given the print view window as its only parameter.
   * @param {Function} [options.closeCallback] A function that is called when the print view is closed. The function is given
   *                   the print view window as its only parameter.
   */
  create(options: CreateOptions) {
    const {
      terria,
      viewState,
      printWindow = window.open(),
      readyCallback,
      closeCallback
    } = options;

    if (!printWindow) {
      console.error("Unable to open new window");
      return;
    }

    if (closeCallback) {
      printWindow.addEventListener("unload", () => {
        closeCallback(printWindow);
      });
    }

    // Open and immediately close the document. This works around a problem in Firefox that is
    // captured here: https://bugzilla.mozilla.org/show_bug.cgi?id=667227.
    // Essentially, when we first create an iframe, it has no document loaded and asynchronously
    // starts a load of "about:blank". If we access the document object and start manipulating it
    // before that async load completes, a new document will be automatically created. But then
    // when the async load completes, the original, automatically-created document gets unloaded
    // and the new "about:blank" gets swapped in. End result: everything we add to the DOM before
    // the async load complete gets lost and Firefox ends up printing a blank page.
    // Explicitly opening and then closing a new document _seems_ to avoid this.
    printWindow.document.open();
    printWindow.document.close();

    printWindow.document.head.innerHTML = `
          <meta charset="UTF-8">
          <title>${terria.appName} Print View</title>
          <style>${styles}</style>
          `;
    printWindow.document.body.innerHTML = '<div id="print"></div>';

    const printView = (
      <PrintView
        terria={terria}
        viewState={viewState}
        window={printWindow}
        readyCallback={readyCallback}
      />
    );
    ReactDOM.render(printView, printWindow.document.getElementById("print"));
  }
}

export const styles = `
    .tjs-_base__list-reset {
        list-style: none;
        padding-left: 0;
        margin: 0;
    }

    .background {
        width: 100%;
        fill: rgba(255, 255, 255, 1.0);
    }

    .map-image {
        max-width: 95vw;
        max-height: 95vh;
    }

    .layer-legends {
        display: inline;
        float: left;
        padding-left: 20px;
        padding-right: 20px;
    }

    .layer-title {
        font-weight: bold;
    }

    h1, h2, h3 {
        clear: both;
    }

    .tjs-_form__input {
        width: 80%;
    }
`;

export default PrintView;
