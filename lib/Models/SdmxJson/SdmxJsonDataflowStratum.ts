import LoadableStratum from "../LoadableStratum";
import SdmxJsonCatalogItem from "./SdmxJsonCatalogItem";
import { BaseModel } from "../Model";
import StratumOrder from "../StratumOrder";
import {
  Dataflow,
  CodeLists,
  ConceptSchemes,
  ContentConstraints,
  DataStructure,
  SdmxJsonStructureMessage,
  ConceptScheme
} from "./SdmxJsonStructureMessage";
import isDefined from "../../Core/isDefined";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import SdmxCatalogItemTraits from "../../Traits/SdmxCatalogItemTraits";
import TerriaError from "../../Core/TerriaError";
import { loadSdmxJsonStructure, parseSdmxUrn } from "./SdmxJsonServerStratum";
import { computed } from "mobx";

export interface SdmxJsonDataflow {
  dataflow: Dataflow;
  dataStructure: DataStructure;
  codelists?: CodeLists;
  conceptSchemes?: ConceptSchemes;
  contentConstraints?: ContentConstraints;
}
export class SdmxJsonDataflowStratum extends LoadableStratum(
  SdmxCatalogItemTraits
) {
  static stratumName = "sdmxJsonDataflow";

  constructor(
    private readonly catalogItem: SdmxJsonCatalogItem,
    private readonly sdmxJsonDataflow: SdmxJsonDataflow
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxJsonDataflowStratum(
      model as SdmxJsonCatalogItem,
      this.sdmxJsonDataflow
    ) as this;
  }

  static async load(
    catalogItem: SdmxJsonCatalogItem
  ): Promise<SdmxJsonDataflowStratum> {
    let dataflowStructure: SdmxJsonStructureMessage = await loadSdmxJsonStructure(
      proxyCatalogItemUrl(
        catalogItem,
        `${catalogItem.url}/dataflow/${catalogItem.agencyId}/${catalogItem.dataflowId}?references=all`
      ),
      false
    );

    // Check response
    if (!isDefined(dataflowStructure.data)) {
      throw new TerriaError({
        title: `Could not load SDMX Dataflow`,
        message: `Invalid JSON object`
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataflows) ||
      dataflowStructure.data.dataflows.length === 0
    ) {
      throw new TerriaError({
        title: `Could not load SDMX Dataflow`,
        message: `Dataflow ${catalogItem.dataflowId} is invalid`
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataStructures) ||
      dataflowStructure.data.dataStructures.length === 0
    ) {
      throw new TerriaError({
        title: `Could not load SDMX Dataflow`,
        message: `No data structure could be found for dataflow ${catalogItem.dataflowId} is invalid`
      });
    }

    return new SdmxJsonDataflowStratum(catalogItem, {
      dataflow: dataflowStructure.data.dataflows[0],
      dataStructure: dataflowStructure.data.dataStructures[0],
      codelists: dataflowStructure.data.codelists,
      conceptSchemes: dataflowStructure.data.conceptSchemes,
      contentConstraints: dataflowStructure.data.contentConstraints
    });
  }

  @computed
  get description() {
    return this.sdmxJsonDataflow.dataflow.description;
  }

  @computed
  get columns() {
    const primaryMeasure = this.sdmxJsonDataflow.dataStructure
      .dataStructureComponents?.measureList.primaryMeasure;
    const primaryMeasureConceptUrn = parseSdmxUrn(
      primaryMeasure?.conceptIdentity
    );
    const primaryMeasureConcept = this.getConcept(
      primaryMeasureConceptUrn?.resourceId,
      primaryMeasureConceptUrn?.descendantIds?.[0]
    );
    const primaryMeasureColumn = {
      name: primaryMeasure?.id,
      title: primaryMeasureConcept?.name,
      units: undefined,
      type: undefined,
      regionType: undefined,
      regionDisambiguationColumn: undefined,
      replaceWithZeroValues: undefined,
      replaceWithNullValues: undefined,
      format: undefined
    };

    const dimColums = [
      ...(this.sdmxJsonDataflow.dataStructure.dataStructureComponents
        ?.dimensionList.dimensions || []),
      ...(this.sdmxJsonDataflow.dataStructure.dataStructureComponents
        ?.dimensionList.timeDimensions || [])
    ].map(dim => {
      const conceptUrn = parseSdmxUrn(dim.conceptIdentity);
      const concept = this.getConcept(
        conceptUrn?.resourceId,
        conceptUrn?.descendantIds?.[0]
      );

      let regionType: string | undefined;

      console.log(this.catalogItem.regionMappedDimensionIds);

      if (
        dim.id &&
        this.catalogItem.regionMappedDimensionIds.includes(dim.id)
      ) {
        // Try to look for manual regionType in regionTypeMap
        regionType = this.catalogItem.regionTypeMap?.find(
          map => map.id === dim.id
        )?.regionType;

        // If TableColumn failed to find suitable region provider -> use country as default
        if (
          !regionType &&
          !super.columns?.find(col => col.name === dim.id)?.regionType
        ) {
          regionType = "country";
        }
      }

      console.log(regionType);

      return {
        name: dim.id,
        title: concept?.name,
        units: undefined,
        type: undefined,
        regionType,
        regionDisambiguationColumn: undefined,
        replaceWithZeroValues: undefined,
        replaceWithNullValues: undefined,
        format: undefined
      };
    });

    return [primaryMeasureColumn, ...dimColums];
  }

  @computed
  get primaryMeasureConceptId() {
    return parseSdmxUrn(
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.measureList
        .primaryMeasure?.conceptIdentity
    )?.resourceId;
  }

  @computed
  get primaryMeasureDimenionId() {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents
      ?.measureList.primaryMeasure?.id;
  }

  /**
   * Returns array of dimensions which can be treated as region columns.
   * By default, if a concept id starts with geo_ (case insenitive) treat it as region mapped,
   * or if the dimensionID is included in this.regionTypeMap
   */
  @computed
  get regionMappedDimensionIds() {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList.dimensions
      ?.map(dim => dim.id)
      .filter(
        id =>
          isDefined(id) &&
          (id.toLowerCase().startsWith("geo_") ||
            this.regionTypeMap?.find(map => id === map.id))
      ) as string[];
  }

  @computed
  get timeDimensionIds() {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList.timeDimensions
      ?.filter(dim => dim.id)
      .map(dim => dim.id) as string[];
  }

  /**
   * By default, view by region if there are regionMapped dimensions
   * Otherwise, view by time-series
   */
  @computed
  get viewBy() {
    if (this.catalogItem.regionMappedDimensionIds.length > 0) {
      return "region";
    }
    if (this.catalogItem.timeDimensionIds.length > 0) {
      return "time";
    }
  }

  @computed
  get dimensions() {
    const dimensionList = this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList.dimensions?.filter(
      isDefined
    );
    if (!Array.isArray(dimensionList) || dimensionList.length === 0) return;

    // Contraint contains allowed dimension values for a given dataflow
    // Get 'actual' contraints (rather than 'allowed' contraints)
    const contraints = this.sdmxJsonDataflow.contentConstraints?.filter(
      c => c.type === "Actual"
    );

    return (
      dimensionList
        // Filter normal enum dimensions
        .filter(
          dim =>
            dim.id &&
            dim.type === "Dimension" &&
            dim.localRepresentation?.enumeration
        )
        .map(dim => {
          // Concept maps dimension's ID to a human-readable name
          const conceptUrn = parseSdmxUrn(dim.conceptIdentity);
          const concept = this.getConcept(
            conceptUrn?.resourceId,
            conceptUrn?.descendantIds?.[0]
          );

          // Codelist maps dimension enum values to human-readable name
          const codelistUrn = parseSdmxUrn(
            dim.localRepresentation?.enumeration
          );
          const codelist = this.getCodelist(codelistUrn?.resourceId);

          // Get allowed options from cubeRegions (there may be multiple - take union of all values - which is probably wrong)
          const allowedOptionIdsSet = contraints?.reduce<Set<string>>(
            (keys, constraint) => {
              constraint.cubeRegions?.forEach(cubeRegion =>
                cubeRegion.keyValues
                  ?.filter(kv => kv.id === dim.id)
                  ?.forEach(
                    regionKey =>
                      regionKey.values &&
                      regionKey.values.forEach(value => keys.add(value))
                  )
              );
              return keys;
            },
            new Set()
          );

          // Convert set to array
          const allowedOptionIds = isDefined(allowedOptionIdsSet)
            ? Array.from(allowedOptionIdsSet)
            : undefined;

          // Create options object by merging allowedOptionIds with codelist (to find labels)
          const options = codelist?.codes
            ?.filter(
              code => allowedOptionIds && allowedOptionIds.includes(code.id!)
            )
            .map(code => {
              return { id: code.id!, name: code.name };
            });

          if (isDefined(options)) {
            return {
              id: dim.id!,
              name: concept?.name as string,
              options: options,
              position: dim.position,
              selectedId: options[0].id // Not sure where to get a better default value from?,
            };
          }
        })
        .filter(isDefined)
    );
  }

  getConceptScheme(id: string) {
    if (!isDefined(id)) return;
    return this.sdmxJsonDataflow.conceptSchemes?.find(c => c.id === id);
  }

  getConcept(
    conceptScheme: ConceptScheme | string | undefined,
    conceptId?: string
  ) {
    if (!isDefined(conceptId)) return;
    let resolvedConceptScheme =
      typeof conceptScheme === "string"
        ? this.getConceptScheme(conceptScheme)
        : conceptScheme;

    return resolvedConceptScheme?.concepts?.find(d => d.id === conceptId);
  }

  getCodelist(id?: string) {
    if (!isDefined(id)) return;
    return this.sdmxJsonDataflow.codelists?.find(c => c.id === id);
  }

  // get dataflowsForCategory(categorySchemeUrn:string) {
  //   const sources = this.SdmxJsonDataflow.categorisations?.filter(cat => cat.target === categorySchemeUrn)?.map(cat => cat.source)
  //   return isDefined(sources) ? filterOutUndefined(sources) : []
  // }
}

StratumOrder.addLoadStratum(SdmxJsonDataflowStratum.stratumName);
