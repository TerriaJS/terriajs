import i18next from "i18next";
import { createTransformer } from "mobx-utils";
import defined from "terriajs-cesium/Source/Core/defined";
import loadXML from "../Core/loadXML";
import TerriaError from "../Core/TerriaError";
import xml2json from "../ThirdParty/xml2json";
import {
  CapabilitiesLegend,
  OnlineResource,
  OwsKeywordList
} from "./OwsInterfaces";

export interface BoundingBox {
  LowerCorner: string;
  UpperCorner: string;
  crs?: string;
  dimensions?: string;
}
export interface ServiceProvider {
  /** A unique identifier for service provider organization. */
  readonly ProviderName?: string;
  /** Reference to the most relevant web site of the service provider. */
  readonly ProviderSite?: OnlineResource;
  /** Information for contacting the service provider. */
  readonly ServiceContact?: ServiceContact;
}

export interface ServiceIdentification {
  /** Title of the service. */
  readonly Title?: string;
  /** Longer narative description of the service. */
  readonly Abstract?: string /** Fees for this service */;
  /** Fees for this service */
  readonly Fees?: string;
  /** Access contraints for this service. */
  readonly AccessConstraints?: string;
  /** List of keywords or keyword phrases to help catalog searching. */
  readonly Keywords?: OwsKeywordList;

  readonly ServiceType: string;

  readonly ServiceTypeVersion: string;
}
export interface ServiceContact {
  /** Name of the responsible person: surname, given name, title separated by a delimiter */
  readonly InvidualName?: string;
  /** Role or position of the responsible person */
  readonly PositionName?: string;
  /** Address of the responsible party */
  readonly ContactInfo?: ContactInfo;
  /** Function performed by the responsible party.  */
  readonly Role?: string;
}

export interface ContactInfo {
  /** Telephone numbers at which the organization or individual may be contacted */
  Phone?: Phone;
  /** Physical and email address at which the organization or individual may be contacted. */
  Address?: ContactInfoAddress;
  /** On-line information that can be used to contact the individual or organization. */
  OnlineResource?: OnlineResource;
  /** Time period (including time zone) when individuals can contact the organization or individual */
  HoursOfService?: string;
  /** Supplemental instructions on how or when to contact the individual or organization. */
  ContactInstructions?: string;
}

export interface ContactInfoAddress {
  AddressType?: string;
  /** Address line for the location. */
  DeliveryPoint?: string;
  /** City of the location. */
  City?: string;
  /** State or province of the location. */
  AdministrativeArea?: string;
  /** ZIP or other postal code. */
  PostalCode?: string;
  /** Country of the physical address. */
  Country?: string;
  /** Address of the electronic mailbox of the responsible organization or individual. */
  ElectronicMailAddress?: string;
}

interface Phone {
  /** Telephone number by which individuals can speak to the responsible organization or individual. */
  Voice?: string;
  /** Telephone number of a facsimile machine for the responsible organization or individual. */
  Facsimile?: string;
}

export interface WmtsLayer {
  // according to start WMTS only have title
  readonly Title: string;
  readonly Abstract?: string;
  readonly Identifier?: string;
  readonly WGS84BoundingBox?: BoundingBox;
  readonly Style?: CapabilitiesStyle | CapabilitiesStyle[];
  readonly Format?: string | ReadonlyArray<string>;
  readonly infoFormat?: string | ReadonlyArray<string>;
  readonly TileMatrixSetLink?: TileMatrixSetLink | TileMatrixSetLink[];
  readonly ResourceURL?: ResourceUrl | ResourceUrl[];
}

/* For some reason LegendUrls are formatted differently from WMS - this makes me very upset >:(
  WMTS Example:
    <LegendURL format="image/png"
    xlink:href="http://www.maps.bob/etopo2/legend.png" />

  WMS Example:
  <LegendURL width="184" height="220">
    <Format>image/png</Format>
    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="http://www.maps.bob/etopo2/legend.png"/>
  </LegendURL>
*/
export interface WmtsCapabilitiesLegend extends CapabilitiesLegend {
  readonly OnlineResource?: undefined;
  readonly "xlink:href"?: string;
}

export interface ResourceUrl {
  format: string;
  resourceType: "tile";
  template: string;
}

export interface CapabilitiesStyle {
  readonly Identifier: string;
  readonly Title: string;
  readonly Abstract?: string;
  readonly Keywords?: OwsKeywordList;
  readonly LegendURL?:
    | WmtsCapabilitiesLegend
    | ReadonlyArray<WmtsCapabilitiesLegend>;
  readonly isDefault?: boolean;
}

interface CapabilitiesJson {
  readonly Version: string;
  readonly Contents?: Contents;
  readonly ServiceIdentification?: ServiceIdentification;
  readonly ServiceProvider?: ServiceProvider;
  readonly OperationsMetadata?: OperationsMetadata;
  readonly ServiceMetadataURL?: OnlineResource;
}

interface OperationsMetadata {
  readonly Operation: Operation;
}

interface Operation {
  name: string;
  DCP: {
    HTTP: {
      Get?: OnlineResource;
    };
  };
}

interface Contents {
  readonly Layer: WmtsLayer;
  readonly TileMatrixSet: TileMatrixSet;
}

export interface TileMatrixSetLink {
  readonly TileMatrixSet: string;
  readonly TileMatrixSetLimits: TileMatrixSetLimits;
}

interface TileMatrixSetLimits {
  readonly TileMatrixLimits: TileMatrixLimits[];
}

interface TileMatrixLimits {
  readonly TileMatrix: any;
  readonly MinTileRow: number;
  readonly MaxTileRow: number;
  readonly MinTileCol: number;
  readonly MaxTileCol: number;
}

export interface TileMatrixSet {
  readonly Identifier: string;
  readonly Title?: string;
  readonly Abstract?: string;
  readonly Keyword?: OwsKeywordList;
  readonly SupportedCRS?: string;
  readonly WellKnowScaleSet?: string;
  readonly TileMatrix: TileMatrix[];
}

export interface TileMatrix {
  readonly Identifier: string;
  readonly Title?: string;
  readonly Abstract?: string;
  readonly Keyword?: OwsKeywordList;
  readonly ScaleDenominator: number;
  readonly TopLeftCorner: string; // there is a wrong indication of TopLevelPoint in WMTS 1.0.0 specification
  readonly TileWidth: number;
  readonly TileHeight: number;
  readonly MatrixWidth: number;
  readonly MatrixHeight: number;
}

export default class WebMapTileServiceCapabilities {
  static fromUrl: (
    url: string
  ) => Promise<WebMapTileServiceCapabilities> = createTransformer(
    (url: string) => {
      return Promise.resolve(loadXML(url)).then(function(capabilitiesXml) {
        const json = xml2json(capabilitiesXml);
        if (!defined(json.ServiceIdentification)) {
          throw new TerriaError({
            title: i18next.t(
              "models.webMapTileServiceCatalogGroup.invalidCapabilitiesTitle"
            ),
            message: i18next.t(
              "models.webMapTileServiceCatalogGroup.invalidCapabilitiesMessage",
              {
                url: url
              }
            )
          });
        }

        return new WebMapTileServiceCapabilities(capabilitiesXml, json);
      });
    }
  );

  readonly layers: WmtsLayer[];
  readonly tileMatrixSets: TileMatrixSet[];

  private constructor(
    readonly xml: XMLDocument,
    readonly json: CapabilitiesJson
  ) {
    this.layers = [];
    this.tileMatrixSets = [];

    const layerElements = this.json.Contents?.Layer as
      | Array<WmtsLayer>
      | WmtsLayer;
    if (layerElements && Array.isArray(layerElements)) {
      this.layers.push(...layerElements);
    } else if (layerElements) {
      this.layers.push(layerElements);
    }

    const tileMatrixSetsElements = this.json.Contents?.TileMatrixSet as
      | Array<TileMatrixSet>
      | TileMatrixSet;
    if (tileMatrixSetsElements && Array.isArray(tileMatrixSetsElements)) {
      this.tileMatrixSets.push(...tileMatrixSetsElements);
    } else if (tileMatrixSetsElements) {
      this.tileMatrixSets.push(tileMatrixSetsElements);
    }
  }

  get ServiceIdentification() {
    return this.json.ServiceIdentification;
  }

  get OperationsMetadata() {
    return this.json.OperationsMetadata;
  }

  get ServiceProvider() {
    return this.json.ServiceProvider;
  }

  /**
   * Finds the layer in GetCapabilities corresponding to a given layer name. Names are
   * resolved as foll
   *    * The layer has the title exact with the name specified.
   *    * The layer name matches the name in the spec if the namespace portion is removed.
   *
   * @param {String} name The layer name to resolve.
   * @returns {LayerType} The resolved layer, or `undefined` if the layer name could not be resolved.
   */
  findLayer(name: string): WmtsLayer | undefined {
    // Look for an exact match on the name.
    if (this.layers === undefined) {
      return undefined;
    }
    let match = this.layers.find(
      layer => layer.Identifier === name || layer.Title === name
    );
    if (!match) {
      const colonIndex = name.indexOf(":");
      if (colonIndex >= 0) {
        // This looks like a namespaced name. Such names will (usually?) show up in GetCapabilities
        // as just their name without the namespace qualifier.
        const nameWithoutNamespace = name.substring(colonIndex + 1);
        match = this.layers.find(
          layer =>
            layer.Identifier === nameWithoutNamespace ||
            layer.Title === nameWithoutNamespace
        );
      }
    }

    return match;
  }

  findTileMatrix(set: string) {
    if (this.tileMatrixSets === undefined) {
      return undefined;
    }
    return this.tileMatrixSets.find(
      tileMatrixSet => tileMatrixSet.Identifier === set
    );
  }
}
