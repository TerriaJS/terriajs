import { computed } from "mobx";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import SdmxCatalogItemTraits from "../../Traits/SdmxCatalogItemTraits";
import LoadableStratum from "../LoadableStratum";
import { BaseModel } from "../Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../StratumOrder";
import SdmxJsonCatalogItem from "./SdmxJsonCatalogItem";
import { loadSdmxJsonStructure, parseSdmxUrn } from "./SdmxJsonServerStratum";
import {
  CodeLists,
  ConceptScheme,
  ConceptSchemes,
  ContentConstraints,
  Dataflow,
  DataStructure,
  SdmxJsonStructureMessage
} from "./SdmxJsonStructureMessage";

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

    const dimensionsList = this.sdmxJsonDataflow.dataStructure
      .dataStructureComponents?.dimensionList;

    let regionTypeFromDimension: string | undefined;

    // Use this.catalogItem.regionTypeConcepts to see if any region types can be extracted from dimensions
    if (
      isDefined(this.catalogItem.regionTypeConcepts) &&
      this.catalogItem.regionTypeConcepts.length > 0
    ) {
      this.catalogItem.regionTypeConcepts.forEach(concept => {
        // Find dimension id with concept
        const dimId = dimensionsList?.dimensions?.find(
          dim => dim.conceptIdentity === concept
        )?.id;

        const dim = this.catalogItem.dimensions?.find(d => d.id === dimId);

        // Set region type to dimension's selected id
        regionTypeFromDimension = dim?.selectedId;
      });

      console.log(`found regionTypeFromStructure ${regionTypeFromDimension}`);
    }

    console.log(this.catalogItem);

    const dimColums = [
      ...(dimensionsList?.dimensions || []),
      ...(dimensionsList?.timeDimensions || [])
    ].map(dim => {
      const conceptUrn = parseSdmxUrn(dim.conceptIdentity);
      const concept = this.getConcept(
        conceptUrn?.resourceId,
        conceptUrn?.descendantIds?.[0]
      );

      let regionType: string | undefined;

      if (
        dim.id &&
        this.catalogItem.regionMappedDimensionIds.includes(dim.id)
      ) {
        // use regionTypeFromDimension or try to look for manual regionType in regionConceptRegionTypeMap
        regionType =
          this.catalogItem.regionConceptRegionTypeMap?.find(
            map => map.id === dim.conceptIdentity
          )?.value || regionTypeFromDimension;

        // If TableColumn failed to find suitable region provider -> use country as default
        // if (
        //   !regionType &&
        //   !super.columns?.find(col => col.name === dim.id)?.regionType
        // ) {
        //   regionType = "country";
        // }
      }

      if (isDefined(regionType)) {
        // Resolve regionType to region provider (this will also match against region provider aliases)
        const matchingRegionProviders = this.catalogItem.regionProviderList?.getRegionDetails(
          [regionType],
          undefined,
          undefined
        );
        if (matchingRegionProviders && matchingRegionProviders.length > 0) {
          regionType = matchingRegionProviders[0].regionProvider.regionType;
        }
      }

      return {
        name: dim.id,
        title: concept?.name,
        units: undefined,
        type: isDefined(regionType) ? "region" : undefined,
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
      ?.filter(
        dim =>
          dim.conceptIdentity &&
          (this.catalogItem.regionConceptRegionTypeMap?.find(
            map => dim.conceptIdentity === map.id
          ) ||
            this.catalogItem.regionConcepts?.includes(dim.conceptIdentity))
      )
      ?.map(dim => dim.id)
      .filter(isDefined);
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

          // Get allowed options from contraints.cubeRegions (there may be multiple - take union of all values - which is probably wrong)
          const allowedOptionIdsSet = Array.isArray(contraints)
            ? contraints.reduce<Set<string>>((keys, constraint) => {
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
              }, new Set())
            : undefined;

          // Convert set to array
          const allowedOptionIds = isDefined(allowedOptionIdsSet)
            ? Array.from(allowedOptionIdsSet)
            : undefined;

          // Get codes by merging allowedOptionIds with codelist
          let codes =
            isDefined(allowedOptionIds) && allowedOptionIds.length > 0
              ? codelist?.codes?.filter(
                  code =>
                    allowedOptionIds && allowedOptionIds.includes(code.id!)
                )
              : // If no allowedOptions were found -> return all codes
                codelist?.codes;

          // Create options object
          const options = codes?.map(code => {
            return { id: code.id!, name: code.name };
          });

          if (isDefined(options)) {
            let selectedId: string | undefined = options[0].id;

            console.log(this.catalogItem.conceptDefaultValueMap);

            const defaultValue = this.catalogItem.conceptDefaultValueMap?.find(
              map => map.id === dim.conceptIdentity
            )?.value;

            if (defaultValue) {
              selectedId = defaultValue;
            } else if (
              dim.conceptIdentity &&
              this.catalogItem.allowUndefinedConcepts?.includes(
                dim.conceptIdentity
              )
            ) {
              selectedId = undefined;
            }

            return {
              id: dim.id!,
              name: concept?.name as string,
              options: options,
              position: dim.position,
              selectedId
              // Not sure where to get a better default value from?,
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
