import { MeasurableGeometry } from "./MeasurableGeometryManager";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Terria from "../../Models/Terria";
import MeasurableGeometryExporter, {
  SUFFIX_POLYGON,
  SUFFIX_LINES,
  SUFFIX_POINTS,
  SUFFIX_MULTIPATH
} from "./MeasurableGeometryExporter";
import i18next from "i18next";

export interface DownloadLink {
  key: string;
  href?: string | false;
  download?: string;
  label: string;
}

export default class MeasurableDownload {
  private terria: Terria;

  constructor(terria: Terria) {
    this.terria = terria;
  }

  static normalizeDefaultFilename(rawName: string): string {
    if (!rawName) return "";

    const withoutExtension = rawName.replace(/\.[^/.]+$/, "");
    const suffixRegex = new RegExp(
      `(?:(?:${SUFFIX_POLYGON}|${SUFFIX_LINES}|${SUFFIX_POINTS})(?:${SUFFIX_MULTIPATH})?)+$`
    );
    return withoutExtension.replace(suffixRegex, "");
  }

  async generateAllFormatLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    ellipsoid: Ellipsoid,
    geomList?: MeasurableGeometry[]
  ): Promise<DownloadLink[]> {
    const allLinks: DownloadLink[] = [];

    allLinks.push({
      key: "",
      label: i18next.t("downloadData.formatPlaceholder")
    });

    try {
      const links = await MeasurableGeometryExporter.generateAllDownloadLinks(
        geom,
        name,
        isMultiPath,
        ellipsoid,
        geomList
      );
      allLinks.push(...links);
    } catch (error) {
      console.error("Error generating format links:", error);
    }

    return allLinks;
  }

  downloadFile(link: DownloadLink): void {
    if (link.href && link.download) {
      const a = document.createElement("a");
      a.href = link.href;
      a.download = link.download;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  isValidForDownload(
    name: string,
    selectedFormat: string,
    isLoading: boolean
  ): boolean {
    return !(!name || selectedFormat === "" || isLoading);
  }

  findLinkByFormat(
    downloadLinks: DownloadLink[],
    selectedFormat: string
  ): DownloadLink | undefined {
    return downloadLinks.find((link) => link.key === selectedFormat);
  }

  handleDownload(
    downloadLinks: DownloadLink[],
    selectedFormat: string
  ): boolean {
    const linkObj = this.findLinkByFormat(downloadLinks, selectedFormat);
    if (linkObj) {
      this.downloadFile(linkObj);
      return true;
    }
    return false;
  }
}
