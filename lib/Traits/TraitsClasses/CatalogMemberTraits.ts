import i18next from "i18next";
import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import EnumDimensionTraits from "./DimensionTraits";

export class MetadataUrlTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "URL",
    description: "The metadata URL of the file or service."
  })
  url?: string;

  @primitiveTrait({
    type: "string",
    name: "Title",
    description: "Title used for metadata URL button."
  })
  title?: string;
}

export class DataUrlTraits extends mixTraits(MetadataUrlTraits) {
  @primitiveTrait({
    type: "string",
    name: "Type",
    description: `Type of data URL. This value will be used to provide context or instruction on how to use the data URL. For example \`wcs\` will provide a link to WCS docs.
    Current supported values are:
    - \`wfs\` = A Web Feature Service (WFS) base URL
    - \`wcs\` = A Web Coverage Service (WCS) base URL
    - \`wfs-complete\` = A complete, ready-to-use link to download features from a WCS server
    -  \`wcs-complete\` = A complete, ready-to-use link to download features from a WFS server
    -  \`direct\` = Direct URL to dataset (this is the default if no \`type\` is specified)
    -  \`none\` = Hide data URL
    `
  })
  type?: "wfs" | "wcs" | "wfs-complete" | "wcs-complete" | "direct" | "none";
}

export class InfoSectionTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the section."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Content",
    description:
      "The content of the section, in Markdown and HTML format. Set this property to null to remove this section entirely.",
    isNullable: true
  })
  content?: string | null;

  @anyTrait({
    name: "Content As Object",
    description:
      "The content of the section which is a JSON object. Set this property to null to remove this section entirely."
  })
  contentAsObject?: JsonObject;

  @primitiveTrait({
    type: "boolean",
    name: "Show",
    description: "Indicates if this info section showing (not collapsed)."
  })
  show? = true;

  static isRemoval(infoSection: InfoSectionTraits) {
    return infoSection.content === null;
  }
}

export class ShortReportTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the section."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Content",
    description: "The content of the section."
  })
  content?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Show",
    description: "Indicates if this short report section showing."
  })
  show = true;
}

class CatalogMemberTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "The name of the catalog item."
  })
  name?: string;

  @primitiveTrait({
    type: "string",
    name: "Description",
    description:
      "The description of the catalog item. Markdown and HTML may be used."
  })
  description?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Hide default description",
    description:
      "If true, then no generic default description will be displayed if `description` is undefined."
  })
  hideDefaultDescription: boolean = false;

  @primitiveTrait({
    type: "string",
    name: "Name in catalog",
    description:
      "The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench."
  })
  nameInCatalog?: string;

  @objectArrayTrait({
    type: InfoSectionTraits,
    name: "Info",
    description: "Human-readable information about this dataset.",
    idProperty: "name"
  })
  info: InfoSectionTraits[] = [];

  @primitiveArrayTrait({
    type: "string",
    name: "InfoSectionOrder",
    description: `An array of section titles defining the display order of info sections. If this property is not defined, {@link DataPreviewSections}'s DEFAULT_SECTION_ORDER is used`
  })
  infoSectionOrder?: string[] = [
    i18next.t("preview.disclaimer"),
    i18next.t("description.name"),
    i18next.t("preview.dataDescription"),
    i18next.t("preview.datasetDescription"),
    i18next.t("preview.serviceDescription"),
    i18next.t("preview.resourceDescription"),
    i18next.t("preview.licence"),
    i18next.t("preview.accessConstraints"),
    i18next.t("preview.author"),
    i18next.t("preview.contact"),
    i18next.t("preview.created"),
    i18next.t("preview.modified"),
    i18next.t("preview.updateFrequency")
  ];

  @primitiveTrait({
    type: "boolean",
    name: "Is catalog item open in workbench",
    description: "Whether the item in the workbench open or collapsed."
  })
  isOpenInWorkbench: boolean = true;

  @primitiveTrait({
    type: "string",
    name: "Short report",
    description: "A short report to show on the now viewing tab."
  })
  shortReport?: string;

  @objectArrayTrait({
    type: ShortReportTraits,
    idProperty: "name",
    name: "Short report sections",
    description: "A list of collapsible sections of the short report"
  })
  shortReportSections?: ShortReportTraits[];

  @primitiveTrait({
    type: "boolean",
    name: "Is experiencing issues",
    description:
      "Whether the catalog item is experiencing issues which may cause its data to be unavailable"
  })
  isExperiencingIssues: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Hide source in explorer window",
    description:
      "Indicates that the source of this data should be hidden from the UI (obviously this isn't super-secure as you can just look at the network requests)."
  })
  hideSource: boolean = false;

  @objectArrayTrait({
    type: MetadataUrlTraits,
    name: "Metadata URLs",
    description: "Metadata URLs to show in data catalog.",
    idProperty: "index"
  })
  metadataUrls?: MetadataUrlTraits[];

  @objectArrayTrait({
    type: DataUrlTraits,
    name: "Data URLs",
    description: "Data URLs to show in data catalog.",
    idProperty: "index"
  })
  dataUrls?: DataUrlTraits[];

  @primitiveTrait({
    name: "Data Custodian",
    type: "string",
    description:
      "Gets or sets a description of the custodian of this data item."
  })
  dataCustodian?: string;

  @objectArrayTrait({
    type: EnumDimensionTraits,
    idProperty: "id",
    name: "Model dimensions",
    description:
      "This provides ability to set model JSON through SelectableDimensions (a dropdown). When an option is selected, the `value` property will be used to call `updateModelFromJson()`. All string properties support Mustache templates (with the catalog member as context)"
  })
  modelDimensions?: EnumDimensionTraits[];

  @primitiveTrait({
    type: "boolean",
    name: "Disable about data",
    description: "Disables the 'About Data' button in the workbench."
  })
  disableAboutData?: boolean;
}

interface CatalogMemberTraits {
  // Add traits here that you want to override from some Mixin or Model class
  // without generating TS2611 type error.
  name?: CatalogMemberTraits["name"];
  shortReport?: CatalogMemberTraits["shortReport"];
  description?: CatalogMemberTraits["description"];
  disableAboutData?: CatalogMemberTraits["disableAboutData"];
}

export default CatalogMemberTraits;
