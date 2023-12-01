import { action, autorun } from "mobx";
import { observer } from "mobx-react";
import { useEffect } from "react";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import LatLonHeight from "../../../Core/LatLonHeight";
import GeoJsonCatalogItem from "../../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import createStratumInstance from "../../../Models/Definition/createStratumInstance";
import StyleTraits from "../../../Traits/TraitsClasses/StyleTraits";
import { useViewState } from "../../Context";

interface PropsType {
  color: string;
  point: LatLonHeight;
}

const PointOnMap = observer(function PointOnMap(props: PropsType) {
  const { terria } = useViewState();

  useEffect(() => {
    let pointItem: GeoJsonCatalogItem | undefined;
    const removeItem = action(() => {
      if (pointItem) {
        terria.overlays.remove(pointItem);
        terria.removeModelReferences(pointItem);
        pointItem.dispose();
        pointItem = undefined;
      }
    });
    const dispose = autorun(() => {
      removeItem();
      pointItem = new GeoJsonCatalogItem(createGuid(), terria);
      pointItem.setTrait(
        CommonStrata.user,
        "style",
        createStratumInstance(StyleTraits, {
          "stroke-width": 3,
          "marker-size": "30",
          stroke: "#ffffff",
          "marker-color": props.color,
          "marker-opacity": 1
        })
      );
      pointItem.setTrait(CommonStrata.user, "geoJsonData", {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [props.point.longitude, props.point.latitude]
        }
      });
      terria.addModel(pointItem);
      terria.overlays.add(pointItem);
    });
    return () => {
      removeItem();
      dispose();
    };
  }, [props.color, props.point]);

  return null;
});

export default PointOnMap;
