import i18next from "i18next";
import { computed } from "mobx";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import SdmxCatalogItemTraits from "../../Traits/SdmxCatalogItemTraits";
import TableColumnTraits from "../../Traits/TableColumnTraits";
import createStratumInstance from "../createStratumInstance";
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

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxJsonDataflowStratum(
      model as SdmxJsonCatalogItem,
      this.sdmxJsonDataflow
    ) as this;
  }

  static async load(
    catalogItem: SdmxJsonCatalogItem
  ): Promise<SdmxJsonDataflowStratum> {
    // Load dataflow (+ all related references)
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
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.invalidResponse"
        )
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataflows) ||
      dataflowStructure.data.dataflows.length === 0
    ) {
      throw new TerriaError({
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.noDataflow",
          this
        )
      });
    }
    if (
      !Array.isArray(dataflowStructure.data.dataStructures) ||
      dataflowStructure.data.dataStructures.length === 0
    ) {
      throw new TerriaError({
        title: i18next.t("models.sdmxJsonDataflowStratum.loadDataErrorTitle"),
        message: i18next.t(
          "models.sdmxJsonDataflowStratum.loadDataErrorMessage.noDatastructure",
          this
        )
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

  constructor(
    private readonly catalogItem: SdmxJsonCatalogItem,
    private readonly sdmxJsonDataflow: SdmxJsonDataflow
  ) {
    super();
  }

  @computed
  get description() {
    return this.sdmxJsonDataflow.dataflow.description;
  }

  /**
   * Find conceptOverrides with type 'region-type' to try to extract regionType from another dimension
   * For example, ABS have a regionType column which may have values (SA1, SA2, ...), which could be used to determine regionType
   */
  @computed
  get regionTypeFromDimension() {
    let regionTypeFromDimension: string | undefined;

    if (
      isDefined(this.catalogItem.conceptOverrides) &&
      this.catalogItem.conceptOverrides.length > 0
    ) {
      // Find conceptOverrides with type 'region-type'
      this.catalogItem.conceptOverrides
        .filter(concept => concept.type === "region-type")
        .forEach(concept => {
          // Find dimension id with concept
          const dimId = this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList?.dimensions?.find(
            dim => dim.conceptIdentity === concept.id
          )?.id;

          const dim = this.catalogItem.dimensions?.find(d => d.id === dimId);

          // Set region type to dimension's selected id
          regionTypeFromDimension = dim?.selectedId;
        });
    }

    return regionTypeFromDimension;
  }

  @computed
  get primaryMeasureColumn() {
    // Get primary measure column
    const primaryMeasure = this.sdmxJsonDataflow.dataStructure
      .dataStructureComponents?.measureList.primaryMeasure;
    const primaryMeasureConceptUrn = parseSdmxUrn(
      primaryMeasure?.conceptIdentity
    );
    const primaryMeasureConcept = this.getConcept(
      primaryMeasureConceptUrn?.resourceId,
      primaryMeasureConceptUrn?.descendantIds?.[0]
    );
    return createStratumInstance(TableColumnTraits, {
      name: primaryMeasure?.id,
      title: primaryMeasureConcept?.name
    });
  }

  /**
   * Gets column traits based on dimension/concept information
   * The main purpose of this is to try to find the region type for columns
   */

  @computed
  get dimensionColumns() {
    const dimensionsList = this.sdmxJsonDataflow.dataStructure
      .dataStructureComponents?.dimensionList;

    // Get columns for all dimensions (excluding time dimensions)
    return (
      dimensionsList?.dimensions
        // Filter out disabled dimensions
        ?.filter(
          dim =>
            isDefined(dim.id) &&
            !this.dimensions?.find(d => d.id === dim.id)?.disable
        )
        .map(dim => {
          // Get concept information for the current dimension
          const conceptUrn = parseSdmxUrn(dim.conceptIdentity);
          const concept = this.getConcept(
            conceptUrn?.resourceId,
            conceptUrn?.descendantIds?.[0]
          );
          const conceptOverride = this.catalogItem.conceptOverrides.find(
            concept => concept.id === dim.conceptIdentity
          );

          // Try to find region type
          let regionType: string | undefined;

          if (dim.id) {
            // Are any regionTypes present in conceptOverrides for the current concept
            regionType = this.matchRegionType(conceptOverride?.regionType);

            // Next try regionTypeFromDimension (only if this concept has override type 'region')
            if (
              !isDefined(regionType) &&
              conceptOverride &&
              conceptOverride.type === "region"
            )
              regionType = this.matchRegionType(this.regionTypeFromDimension);

            // Then check if dimension name (column name) is valid regionType
            if (!isDefined(regionType))
              regionType = this.matchRegionType(dim.id);

            // Try concept name?
            if (!isDefined(regionType))
              regionType = this.matchRegionType(concept?.name);

            // Finally, try concept id (the string, not the full URN)
            if (!isDefined(regionType))
              regionType = this.matchRegionType(concept?.id);
          }

          return createStratumInstance(TableColumnTraits, {
            name: dim.id,
            title: concept?.name,
            type: isDefined(regionType) ? "region" : undefined,
            regionType
          });
        }) || []
    );
  }

  @computed
  get columns() {
    return [this.primaryMeasureColumn, ...this.dimensionColumns];
  }

  /**
   * Try to resolve `regionType` to a region provider (this will also match against region provider aliases)
   */
  matchRegionType(regionType?: string): string | undefined {
    if (!isDefined(regionType)) return;
    const matchingRegionProviders = this.catalogItem.regionProviderList?.getRegionDetails(
      [regionType],
      undefined,
      undefined
    );
    if (matchingRegionProviders && matchingRegionProviders.length > 0) {
      return matchingRegionProviders[0].regionProvider.regionType;
    }
  }

  @computed
  get primaryMeasureConceptId() {
    return parseSdmxUrn(
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.measureList
        .primaryMeasure?.conceptIdentity
    )?.resourceId;
  }

  @computed
  get primaryMeasureDimensionId() {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents
      ?.measureList.primaryMeasure?.id;
  }

  @computed
  get regionMappedDimensionIds() {
    return this.dimensionColumns
      .filter(col => col.type === "region")
      .map(col => col.name)
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

  /**
   * Enable manual region mapping if viewby is undefined (no region or time dimensions)
   */
  @computed
  get enableManualRegionMapping() {
    return !isDefined(this.viewBy);
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
          const conceptOverride = this.catalogItem.conceptOverrides?.find(
            concept => concept.id === dim.conceptIdentity
          );

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

          // Create options object - use conceptOverride or options generated from codeslist
          const options =
            isDefined(conceptOverride?.options) &&
            conceptOverride!.options.length > 0
              ? conceptOverride?.options.map(option => {
                  return { id: option.id, name: option.name, value: undefined };
                })
              : codes?.map(code => {
                  return { id: code.id!, name: code.name, value: undefined };
                });

          if (isDefined(options)) {
            // Use first option as default if no other default is provided
            let selectedId: string | undefined = conceptOverride?.allowUndefined
              ? undefined
              : options[0].id;

            // Override selectedId if it a valid option
            if (
              isDefined(conceptOverride?.selectedId) &&
              options.find(option => option.id === conceptOverride?.selectedId)
            ) {
              selectedId = conceptOverride?.selectedId;
            }

            return {
              id: dim.id!,
              name: conceptOverride?.name || concept?.name,
              options: options,
              position: dim.position,
              disable: conceptOverride?.disable,
              allowUndefined: conceptOverride?.allowUndefined,
              selectedId: selectedId
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
}

StratumOrder.addLoadStratum(SdmxJsonDataflowStratum.stratumName);
