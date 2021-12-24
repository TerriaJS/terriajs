import React, { useState } from "react";
import ReactDOM from "react-dom";
import Terria from "../../../../../Models/Terria";
import ViewState from "../../../../../ReactViewModels/ViewState";

import DOMPurify from "dompurify";

import DistanceLegend from "../../../Legend/DistanceLegend";
import { terriaTheme } from "../../../../StandardUserInterface/StandardTheme";
import styled, { StyleSheetManager, ThemeProvider } from "styled-components";

import Button from "../../../../../Styled/Button";

import { useEffect } from "react";
import PrintViewMap from "./PrintViewMap";
import PrintWorkbench from "./PrintWorkbench";
import PrintDatasets from "./PrintDatasets";
import { buildShareLink } from "../BuildShareLink";
import PrintSource from "./PrintSource";

// interface CreateOptions {
//   terria: Terria;
//   viewState: ViewState;
//   printWindow: Window;
//   readyCallback: (printWindow: Window) => void;
//   closeCallback: (printWindow: Window) => void;
// }

// class PrintView extends React.Component<Props, State> {
//   printWindowIntervalId: number | undefined;
//   mainWindowIntervalId: number | undefined;
//   window: Window | null;
//   rootNode: Element;

//   constructor(props: Props) {
//     super(props);
//     this.state = {
//       mapImageDataUrl: undefined,
//       isCheckingForImages: true
//     };

//     this.window = null;
//     this.rootNode = document.createElement("div");
//   }

//   componentDidMount() {
//     this.window = window.open();
//     this.window?.document.body.appendChild(this.rootNode);

//     return this.props.terria.currentViewer
//       .captureScreenshot()
//       .then(mapImageDataUrl => {
//         this.setState({
//           mapImageDataUrl: mapImageDataUrl
//         });
//       });
//   }

//   render() {
//     return ReactDOM.createPortal(
//       <p>
//         <img
//           className="map-image"
//           src={this.state.mapImageDataUrl}
//           alt="Map snapshot"
//         />
//       </p>,
//       this.rootNode
//     );
//     // if (!this.state.mapImageDataUrl) {
//     //   return <div>Creating print view...</div>;
//     // }
//     // return (
//     //   <ThemeProvider theme={terriaTheme}>
//     //     <PrintViewButtons />
//     //     <p>
//     //       <img
//     //         className="map-image"
//     //         src={this.state.mapImageDataUrl}
//     //         alt="Map snapshot"
//     //       />
//     //     </p>
//     //     <DistanceLegend terria={this.props.terria} />
//     //     {this.props.terria.workbench.items.map(this.renderLegend)}
//     //     {this.renderFeatureInfo()}
//     //     <h1>Dataset Details</h1>
//     //     {this.props.terria.workbench.items.map(this.renderDetails)}
//     //     <h1>Map Credits</h1>
//     //     {/* TODO: We don't have a way of getting credits yet*/}
//     //     {this.props.terria.configParameters.printDisclaimer ? (
//     //       <>
//     //         <h1>Print Disclaimer</h1>
//     //         <p>{this.props.terria.configParameters.printDisclaimer.text}</p>
//     //       </>
//     //     ) : null}
//     //   </ThemeProvider>
//     // );
//   }

//   renderLegend(
//     catalogItem: MappableMixin.Instance &
//       DiscretelyTimeVaryingMixin.Instance &
//       CatalogMemeberMixin.Instance &
//       BaseModel &
//       any
//   ) {
//     if (!catalogItem.isMappable) {
//       return null;
//     }

//     return (
//       <div key={catalogItem.uniqueId} className="layer-legends">
//         <div className="layer-title">{catalogItem.name}</div>
//         {catalogItem.currentTime && (
//           <div className="layer-time">Time: {catalogItem.currentTime}</div>
//         )}
//         <Legend forPrint={true} item={catalogItem} />
//       </div>
//     );
//   }

//   renderDetails(catalogItem: any) {
//     if (!catalogItem.isMappable) {
//       return null;
//     }

//     const nowViewingItem = catalogItem.nowViewingCatalogItem || catalogItem;
//     return (
//       <div key={catalogItem.uniqueId} className="layer-details">
//         <h2>{catalogItem.name}</h2>
//         <Description item={nowViewingItem} printView={true} />
//       </div>
//     );
//   }

//   renderFeatureInfo() {
//     if (
//       !this.props.viewState.featureInfoPanelIsVisible ||
//       !this.props.terria.pickedFeatures ||
//       !this.props.terria.pickedFeatures.features ||
//       this.props.terria.pickedFeatures.features.length === 0
//     ) {
//       return null;
//     }

//     return (
//       <div className="feature-info">
//         <h1>Feature Information</h1>
//         <FeatureInfoPanel
//           terria={this.props.terria}
//           viewState={this.props.viewState}
//           printView={true}
//         />
//       </div>
//     );
//   }
// }

const styles = `
    .tjs-_base__list-reset {
        list-style: none;
        padding-left: 0;
        margin: 0;
    }


    .map-image {
        max-width: 1200px;
    }

    h1, h2, h3 {
      clear: both;
    }

    .tjs-_form__input {
      width: 80%;
    }

    .tjs-legend__distanceLegend {
      display: inline-block;
      text-align: center;
    }

    .tjs-legend__bar {
      border-bottom: 3px solid black;
    }

    body {
      display:flex;
      justify-content: center;
      width: 100%
    }

    @media print {
      body {
        display: block;
      }
      .PrintView__printControls {
        display: none;
      }
    }

    main {
      max-width: 1200px;
    }
`;

const mkStyle = (unsafeCSS: string) => {
  const style = document.createElement("style");
  style.innerHTML = DOMPurify.sanitize(unsafeCSS);
  return style;
};

interface Props {
  window: Window;
  terria: Terria;
  viewState: ViewState;
  closeCallback: () => void;
}

const PrintView = (props: Props) => {
  const [rootNode] = useState(document.createElement("main"));
  const [screenshot, setScreenshot] = useState<Promise<string> | null>(null);

  useEffect(() => {
      props.window.document.title = "Print view";
      props.window.document.head.appendChild(mkStyle(styles));
      props.window.document.body.appendChild(rootNode);
      props.window.addEventListener("beforeunload", props.closeCallback);
  }, []);

  useEffect(() => {
    setScreenshot(props.terria.currentViewer.captureScreenshot());
  }, []);

  return ReactDOM.createPortal(
    <StyleSheetManager target={rootNode}>
      <ThemeProvider theme={terriaTheme}>
        <section className="PrintView__printControls">
          <Button primary onClick={props.window.print}>
            Print
          </Button>
        </section>
        <section className="mapSection">
          <div className="datasets">
            <PrintWorkbench workbench={props.terria.workbench} />
          </div>
          <div className="map">
            {screenshot ? (
              <PrintViewMap screenshot={screenshot} />
            ) : (
              <div>loading</div>
            )}
            <DistanceLegend terria={props.terria} />
          </div>
        </section>
        <section className="PrintView__source">
          <PrintSource link={buildShareLink(props.terria, props.viewState)} />
        </section>
        <section>
          <PrintDatasets items={props.terria.workbench.items} />
        </section>
      </ThemeProvider>
    </StyleSheetManager>,
    rootNode
  );
};

export default PrintView;
