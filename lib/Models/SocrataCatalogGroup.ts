import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import runLater from "../Core/runLater";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ModelReference from "../Traits/ModelReference";
import SocrataCatalogGroupTraits, {
  FacetFilterTraits
} from "../Traits/TraitsClasses/SocrataCatalogGroupTraits";
import CatalogGroup from "./CatalogGroupNew";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import CsvCatalogItem from "./CsvCatalogItem";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import { SocrataMapViewCatalogItem } from "./SocrataMapViewCatalogItem";
import StratumOrder from "./StratumOrder";

export interface Facet {
  facet: string;
  count: number;
  values: { value: string; count: number }[];
}

export interface ResultResponse {
  resultSetSize: number;
  timings: unknown;
  results: Result[];
}

export interface Result {
  resource: {
    name: string;
    id: string;
    parent_fxf: unknown;
    description?: string;
    attribution?: string;
    attribution_link?: string;
    contact_email?: string;
    type: "dataset" | "map" | undefined;
    updatedAt: string;
    createdAt: string;
    metadata_updated_at: string;
    data_updated_at: string;
    // publication_date: string; not sure if this is official
    page_views: {
      page_views_last_week: number;
      page_views_last_month: number;
      page_views_total: number;
      page_views_last_week_log: number;
      page_views_last_month_log: number;
      page_views_total_log: number;
    };
    columns_name: string[];
    columns_field_name: string[];
    columns_datatype: string[];
    columns_description: string[];
    columns_format: {
      precisionStyle?: string;
      noCommas?: string;
      align?: string;
    }[];
    download_count: number;
    provenance: string;
    lens_view_type:
      | "tabular"
      | "blobby"
      | "href"
      | "geo"
      | "story"
      | "measure"
      | "gateway_plugin"
      | undefined;
    blob_mime_type: null | string;
    hide_from_data_json: boolean;
  };
  classification: {
    categories: string[];
    tags: string[];
    domain_category: string;
    domain_tags: string[];
    domain_metadata: { key: string; value: string }[];
  };
  metadata: {
    domain: string;
    license: string;
  };
  permalink: string;
  link: string;
  owner?: {
    id: string;
    user_type?: string;
    display_name: string;
  };
  creator?: {
    id: string;
    user_type?: string;
    display_name: string;
  };
}

export interface SocrataError {
  code?: string;
  error: true | string;
  message?: string;
}

export class SocrataCatalogStratum extends LoadableStratum(
  SocrataCatalogGroupTraits
) {
  static stratumName = "socrataCatalog";

  static async load(
    catalogGroup: SocrataCatalogGroup
  ): Promise<SocrataCatalogStratum> {
    if (!catalogGroup.url) throw "`url` must be set";

    const filterQuery = Object.assign({}, catalogGroup.filterQuery, {
      only: "dataset,map"
    });

    const domain = URI(catalogGroup.url).hostname();

    let facets: Facet[] = [];
    let results: Result[] = [];

    // If not facet filters have been set - get facets
    if (
      !isDefined(catalogGroup.facetFilters) ||
      catalogGroup.facetFilters.length === 0
    ) {
      const facetsToUse = catalogGroup.facetGroups;

      const facetUri = URI(
        `${catalogGroup.url}/api/catalog/v1/domains/${domain}/facets`
      ).addQuery(filterQuery);

      const facetResponse = await loadJson(
        proxyCatalogItemUrl(catalogGroup, facetUri.toString())
      );

      if (facetResponse.error) {
        throw facetResponse.message ?? facetResponse.error;
      }

      facets = facetResponse;

      if (!Array.isArray(facets))
        throw `Could not fetch facets for domain ${domain}`;

      facets = facets.filter(f => facetsToUse.includes(f.facet));

      if (facets.length === 0)
        throw `Could not find any facets for domain ${domain}`;
    }

    // If facetFilter is set, use it to search for datasets
    else {
      // http://api.us.socrata.com/api/catalog/v1?categories=Education&tags=families&search_context=data.seattle.gov
      const resultsUri = URI(
        `${catalogGroup.url}/api/catalog/v1?search_context=${domain}`
      ).addQuery(filterQuery);

      catalogGroup.facetFilters.forEach(({ name, value }) =>
        name && isDefined(value) ? resultsUri.addQuery(name, value) : null
      );
      const resultsResponse = await loadJson(
        proxyCatalogItemUrl(catalogGroup, resultsUri.toString())
      );

      if (resultsResponse.error) {
        throw resultsResponse.message ?? resultsResponse.error;
      }

      results = (resultsResponse as ResultResponse).results;

      if (!Array.isArray(results) || results.length === 0)
        throw `Could not find any results for domain ${domain} and facets: ${catalogGroup.facetFilters
          .map(({ name, value }) => `${name} = ${value}`)
          .join(", ")}`;
    }

    return new SocrataCatalogStratum(catalogGroup, facets, results);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SocrataCatalogStratum(
      model as SocrataCatalogGroup,
      this.facets,
      this.results
    ) as this;
  }

  constructor(
    private readonly catalogGroup: SocrataCatalogGroup,
    private readonly facets: Facet[],
    private readonly results: Result[]
  ) {
    super();
  }

  @computed
  get members(): ModelReference[] {
    return [
      ...this.facets.map(f => this.getFacetId(f)),
      ...this.results.map(r => this.getResultId(r))
    ];
  }

  createMembers() {
    this.facets.forEach(facet => this.createGroupFromFacet(facet));
    this.results.forEach(result => this.createItemFromResult(result));
  }

  /** Turn facet into SocrataCatalogGroup */
  @action
  createGroupFromFacet(facet: Facet) {
    const facetGroupId = this.getFacetId(facet);

    // Create group for Facet
    let facetGroup = this.catalogGroup.terria.getModelById(
      CatalogGroup,
      facetGroupId
    );
    if (facetGroup === undefined) {
      facetGroup = new CatalogGroup(
        facetGroupId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(facetGroup);
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;
    facetGroup.strata.delete(stratum);

    facetGroup.setTrait(stratum, "name", facet.facet);

    // Create child groups for Facet values
    facet.values.forEach(facetValue => {
      const facetValueId = `${facetGroupId}/${facetValue.value}`;

      let facetValueGroup = this.catalogGroup.terria.getModelById(
        SocrataCatalogGroup,
        facetValueId
      );
      if (facetValueGroup === undefined) {
        facetValueGroup = new SocrataCatalogGroup(
          facetValueId,
          this.catalogGroup.terria,
          undefined
        );
        this.catalogGroup.terria.addModel(facetValueGroup);
      }

      // Replace the stratum inherited from the parent group.
      const stratum = CommonStrata.underride;
      facetValueGroup.strata.delete(stratum);

      facetValueGroup.setTrait(
        stratum,
        "name",
        `${facetValue.value}${
          facetValue.count ? ` (${facetValue.count ?? 0})` : ""
        }`
      );

      facetValueGroup.setTrait(stratum, "url", this.catalogGroup.url);

      facetValueGroup.setTrait(stratum, "facetFilters", [
        createStratumInstance(FacetFilterTraits, {
          name: facet.facet,
          value: facetValue.value
        })
      ]);

      facetGroup!.add(CommonStrata.underride, facetValueGroup);

      // Add shareKey for v7 share compabitility
      // In v7 socrata group structure uses categories as top level group (whereas v8 facets as top level)'
      // For example
      // - v8 = //socrata melbourne/categories/Business
      // - v7 = //socrata melbourne/Business
      if (facet.facet === "categories")
        this.catalogGroup.terria.addShareKey(
          facetValueId,
          facetValueId.replace("/categories/", "/")
        );
    });
  }

  /** Turn Result into catalog item */
  @action
  createItemFromResult(result: Result) {
    const resultId = this.getResultId(result);

    const stratum = CommonStrata.underride;

    let resultModel:
      | CsvCatalogItem
      | GeoJsonCatalogItem
      | SocrataMapViewCatalogItem
      | undefined;

    // If dataset resource
    // - If has geometery - create GeoJSONCatalogItem
    // - Otherwise - create CsvCatalogItem
    if (result.resource.type === "dataset") {
      if (
        result.resource.columns_datatype.find(type =>
          [
            "Point",
            "Line",
            "Polygon",
            "MultiLine",
            "MultiPoint",
            "MultiPolygon",
            "Location"
          ].includes(type)
        )
      ) {
        resultModel = this.catalogGroup.terria.getModelById(
          GeoJsonCatalogItem,
          resultId
        );
        if (resultModel === undefined) {
          resultModel = new GeoJsonCatalogItem(
            resultId,
            this.catalogGroup.terria,
            undefined
          );
          this.catalogGroup.terria.addModel(resultModel);
        }

        // Replace the stratum inherited from the parent group.
        resultModel.strata.delete(stratum);

        resultModel.setTrait(
          stratum,
          "url",
          `${this.catalogGroup.url}/resource/${result.resource.id}.geojson?$limit=10000`
        );
      } else {
        resultModel = this.catalogGroup.terria.getModelById(
          CsvCatalogItem,
          resultId
        );
        if (resultModel === undefined) {
          resultModel = new CsvCatalogItem(
            resultId,
            this.catalogGroup.terria,
            undefined
          );
          this.catalogGroup.terria.addModel(resultModel);
        }

        // Replace the stratum inherited from the parent group.
        resultModel.strata.delete(stratum);

        resultModel.setTrait(
          stratum,
          "url",
          `${this.catalogGroup.url}/resource/${result.resource.id}.csv?$limit=10000`
        );
      }
    } else if (result.resource.type === "map") {
      resultModel = this.catalogGroup.terria.getModelById(
        SocrataMapViewCatalogItem,
        resultId
      );
      if (resultModel === undefined) {
        resultModel = new SocrataMapViewCatalogItem(
          resultId,
          this.catalogGroup.terria,
          undefined
        );
        this.catalogGroup.terria.addModel(resultModel);
      }

      // Replace the stratum inherited from the parent group.

      resultModel.strata.delete(stratum);

      resultModel.setTrait(stratum, "url", this.catalogGroup.url);
      resultModel.setTrait(stratum, "resourceId", result.resource.id);
    }

    if (resultModel) {
      resultModel.setTrait(stratum, "name", result.resource.name);

      // Add shareKey for v7 share compabitility
      // In v7 socrata group structure uses categories as top level group (whereas v8 facets as top level)'
      // For example
      // - v8 = //socrata melbourne/categories/Business/aia8-ryiq
      // - v7 = //socrata melbourne/Business/aia8-ryiq
      if (resultId.includes("/categories/"))
        this.catalogGroup.terria.addShareKey(
          resultId,
          resultId.replace("/categories/", "/")
        );
    }
  }

  getFacetId(facet: Facet) {
    return `${this.catalogGroup.uniqueId}/${facet.facet}`;
  }

  getResultId(result: Result) {
    return `${this.catalogGroup.uniqueId}/${result.resource.id}`;
  }
}

StratumOrder.addLoadStratum(SocrataCatalogStratum.stratumName);

export default class SocrataCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(SocrataCatalogGroupTraits)))
) {
  static readonly type = "socrata-group";

  get type() {
    return SocrataCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
    if (!this.strata.has(SocrataCatalogStratum.stratumName)) {
      const stratum = await SocrataCatalogStratum.load(this);
      runInAction(() => {
        this.strata.set(SocrataCatalogStratum.stratumName, stratum);
      });
    }
  }

  protected async forceLoadMembers() {
    const socrataServerStratum = <SocrataCatalogStratum | undefined>(
      this.strata.get(SocrataCatalogStratum.stratumName)
    );
    if (socrataServerStratum) {
      await runLater(() => socrataServerStratum.createMembers());
    }
  }
}
