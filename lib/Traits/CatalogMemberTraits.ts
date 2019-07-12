import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import objectTrait from "./objectTrait";
import primitiveTrait from "./primitiveTrait";

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
}

export default class CatalogMemberTraits extends ModelTraits {
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
    type: "string",
    name: "Name in catalog",
    description:
      "The name of the item to be displayed in the catalog, if it is different from the one to display in the workbench."
  })
  nameInCatalog?: string;

  @objectTrait({
    type: InfoSectionTraits,
    name: "Favorite Info Section",
    description: "Yay"
  })
  favoriteInfoSection?: InfoSectionTraits;

  @objectArrayTrait({
    type: InfoSectionTraits,
    name: "Info",
    description: "Human-readable information about this dataset.",
    idProperty: "name"
  })
  info: InfoSectionTraits[] = [];

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
}
