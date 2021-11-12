import Description from "../../../../Preview/Description";
import FeatureInfoPanel from "../../../../FeatureInfo/FeatureInfoPanel";
import Legend from "../../../../Workbench/Controls/Legend";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import Terria from "../../../../../Models/Terria";
import ViewState from "../../../../../ReactViewModels/ViewState";
import CatalogMemeberMixin from "../../../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../../../ModelMixins/MappableMixin";
import { BaseModel } from "../../../../../Models/Definition/Model";
import DiscretelyTimeVaryingMixin from "../../../../../ModelMixins/DiscretelyTimeVaryingMixin";

import DistanceLegend from "../../../Legend/DistanceLegend";
import PrintViewButtons from "./PrintViewButtons";
import { terriaTheme } from "../../../../StandardUserInterface/StandardTheme";
import { StyleSheetManager, ThemeProvider } from "styled-components";

import { useEffect } from 'react';


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

// export const styles = `
//     .tjs-_base__list-reset {
//         list-style: none;
//         padding-left: 0;
//         margin: 0;
//     }

//     .background {
//         width: 100%;
//         fill: rgba(255, 255, 255, 1.0);
//     }

//     .map-image {
//         max-width: 95vw;
//         max-height: 95vh;
//     }

//     .layer-legends {
//         display: inline;
//         float: left;
//         padding-left: 20px;
//         padding-right: 20px;
//     }

//     .layer-title {
//         font-weight: bold;
//     }

//     h1, h2, h3 {
//         clear: both;
//     }

//     .tjs-_form__input {
//         width: 80%;
//     }
// `;

interface Props {
  terria: Terria;
  viewState: ViewState;
  window: Window;
  readyCallback: (window: Window) => void;
}

const PrintView = (props:Props) => {
  const [mapImageData, setMapImageData] = useState<string| null>(null);
  const [rootNode] = useState(document.createElement("div"));

  useEffect(() => {
    const newWindow:Window|null = window.open();
    newWindow?.document.body.appendChild(rootNode);
  },[])

  useEffect(() => {
    props.terria.currentViewer
      .captureScreenshot()
      .then(mapImageDataUrl => setMapImageData(mapImageDataUrl))
      .catch(console.error)
  })


  return ReactDOM.createPortal(
    mapImageData ?
    <p>
      <img
        className="map-image"
        src={mapImageData}
        alt="Map snapshot" />
    </p> : <div>Loading map image...</div>
    ,
    rootNode
  );
}

export default PrintView;
