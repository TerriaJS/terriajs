import { MeasurableGeometry } from "./MeasurableGeometryManager";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Terria from "../../Models/Terria";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import KmlCatalogItem from "../../Models/Catalog/CatalogItems/KmlCatalogItem";
import GpxCatalogItem from "../../Models/Catalog/CatalogItems/GpxCatalogItem";
import CsvCatalogItem from "../../Models/Catalog/CatalogItems/CsvCatalogItem";
import i18next from "i18next";

export interface DownloadLink {
  key: string;
  href?: string | false;
  download?: string;
  label: string;
}

export default class MeasurableDownload {
  private terria: Terria;
  private formatHandlers: any[] = [];

  constructor(terria: Terria) {
    this.terria = terria;
    this.initializeFormatHandlers();
  }

  private initializeFormatHandlers(): void {
    this.formatHandlers = [
      new CsvCatalogItem("format-csv", this.terria, undefined),
      new GeoJsonCatalogItem("format-geojson", this.terria),
      new KmlCatalogItem("format-kml", this.terria),
      new GpxCatalogItem("format-gpx", this.terria)
    ];
  }

  async generateAllFormatLinks(
    geom: MeasurableGeometry,
    name: string,
    isMultiPath: boolean,
    geomList?: MeasurableGeometry[],
    ellipsoid?: Ellipsoid
  ): Promise<DownloadLink[]> {
    const allLinks: DownloadLink[] = [];

    allLinks.push({
      key: "",
      label: i18next.t("downloadData.formatPlaceholder")
    });

    try {
      for (const handler of this.formatHandlers) {
        try {
          const links = await handler.generateDownloadLinks(
            geom,
            name,
            isMultiPath,
            geomList,
            ellipsoid
          );
          allLinks.push(...links);
        } catch (error) {
          console.warn(`Error generating links for ${handler.type}:`, error);
        }
      }
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
