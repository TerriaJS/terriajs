import CesiumMath from "terriajs-cesium/Source/Core/Math";
import DataSource from "terriajs-cesiums/Source/DataSources/DataSource";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Model from "../Models/Model";
import MappableTraits from "../Traits/MappableTraits";
import Mappable, { isDataSource, ImageryParts } from "../Models/Mappable";

type ZoomableModel = Model<MappableTraits>;

export default function ZoomableMixin<T extends Constructor<ZoomableModel>>(
    Base: T
) {
    abstract class ZoomableMixin extends Base implements Mappable {
        abstract readonly mapItems: ReadonlyArray<DataSource | ImageryParts>;

        readonly canZoomTo = true;

        zoomTo() {
            if (isDefined(this.rectangle)) {
                const rect = Rectangle.fromDegrees(
                    this.rectangle.west,
                    this.rectangle.south,
                    this.rectangle.east,
                    this.rectangle.north
                );
                return this.zoomToRectangle(rect);
            }
        }

        private zoomToRectangle(rect: Rectangle) {
            const epsilon = CesiumMath.EPSILON3;

            if (rect.east === rect.west) {
                rect.east += epsilon;
                rect.west -= epsilon;
            }

            if (rect.north === rect.south) {
                rect.north += epsilon;
                rect.south -= epsilon;
            }

            return this.terria.currentViewer.zoomTo(rect);
        }
    }

    return ZoomableMixin;
}
