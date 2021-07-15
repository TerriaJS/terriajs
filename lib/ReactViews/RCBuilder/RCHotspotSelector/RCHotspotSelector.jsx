import PropTypes from "prop-types";
import { default as React, useEffect, useRef, useState } from "react";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Color from "terriajs-cesium/Source/Core/Color";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import Styles from "../RCStoryEditor/RCStoryEditor.scss";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import GeoJsonCatalogItem from "../../../Models/GeoJsonCatalogItem";

function RCHotspotSelector(props) {
  const [listenForHotspot, setListenForHotspot] = useState(false);
  const [selectHotspotSubscription, setSelectHotspotSubscription] = useState(
    null
  );
  const hotspotDatasourceRef = useRef(null);
  const listeningForHotspotRef = useRef(null);
  listeningForHotspotRef.current = listenForHotspot;
  const { hotspotPoint, setHotspotPoint } = props;

  // Listen for picked features/position
  useEffect(() => {
    const { terria } = props.viewState;
    setSelectHotspotSubscription(
      knockout.getObservable(terria, "pickedFeatures").subscribe(() => {
        const isListening = listeningForHotspotRef.current;
        if (isListening) {
          // Convert position to cartographic
          const point = Cartographic.fromCartesian(
            terria.pickedFeatures.pickPosition
          );
          setHotspotPoint({
            latitude: (point.latitude / Math.PI) * 180,
            longitude: (point.longitude / Math.PI) * 180
          });
          setListenForHotspot(false);
        }
      })
    );
    return () => {
      if (selectHotspotSubscription !== null) {
        selectHotspotSubscription.dispose();
      }
    };
  }, []);

  // Place hotspot marker on map
  useEffect(() => {
    if (hotspotPoint === null) {
      return;
    }
    const { terria } = props.viewState;
    const catalogItem = terria.nowViewing.items.find(
      item => item.name === "hotspots"
    );
    if (catalogItem !== undefined) {
      catalogItem._dataSource.load(
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [hotspotPoint.longitude, hotspotPoint.latitude]
          }
        },
        {
          markerSymbol: "circle",
          markerSize: 64,
          markerColor: Color.fromRgba(0xee7755ff)
        }
      );
    }
  }, [hotspotPoint]);

  const hotspotText = hotspotPoint
    ? `${Number(hotspotPoint.latitude).toFixed(4)}, ${Number(
        hotspotPoint.longitude
      ).toFixed(4)}`
    : "none set";

  return (
    <div className={Styles.group}>
      <label className={Styles.topLabel}>Hotspot</label>
      {!listenForHotspot && (
        <div className={Styles.container}>
          <span>Set at: {hotspotText}</span>
          <button
            type="button"
            className={Styles.RCButton}
            onClick={() => setListenForHotspot(true)}
          >
            Select hotspot
          </button>
        </div>
      )}
      {listenForHotspot && (
        <div className={Styles.container}>
          <span>Click on map to set the hotspot position</span>&nbsp;
          <button
            onClick={() => setListenForHotspot(false)}
            className={Styles.RCButton}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

RCHotspotSelector.propTypes = {
  viewState: PropTypes.object,
  hotspotPoint: PropTypes.object,
  setHotspotPoint: PropTypes.func
};
export default RCHotspotSelector;
