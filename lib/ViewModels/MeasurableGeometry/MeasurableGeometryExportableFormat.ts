import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import { DownloadLink } from "./MeasurableGeometryDownload";
import { MeasurableGeometry } from "./MeasurableGeometryManager";

interface ExportableFormat {
  generateDownloadLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    geomList?: MeasurableGeometry[],
    ellipsoid?: Ellipsoid
  ): Promise<DownloadLink[]>;
}

export default ExportableFormat;
