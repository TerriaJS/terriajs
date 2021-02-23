import i18next from "i18next";
import { computed } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import isDefined from "../../Core/isDefined";
import TerriaError from "../../Core/TerriaError";
import { FeatureInfoTemplateTraits } from "../../Traits/FeatureInfoTraits";
import LegendTraits from "../../Traits/LegendTraits";
import SdmxCatalogItemTraits, {
  SdmxDimensionTraits
} from "../../Traits/SdmxCatalogItemTraits";
import TableColorStyleTraits from "../../Traits/TableColorStyleTraits";
import TableColumnTraits from "../../Traits/TableColumnTraits";
import TableStyleTraits from "../../Traits/TableStyleTraits";
import createStratumInstance from "../createStratumInstance";
import LoadableStratum from "../LoadableStratum";
import { BaseModel } from "../Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../StratumFromTraits";
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
        `${catalogItem.baseUrl}/dataflow/${catalogItem.agencyId}/${catalogItem.dataflowId}?references=all`
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
   * Find modelOverrides with type 'region-type' to try to extract regionType from another dimension
   * For example, ABS have a regionType dimension which may have values (SA1, SA2, ...), which could be used to determine regionType
   */
  @computed
  get regionTypeFromDimension() {
    let regionTypeFromDimension: string | undefined;
    // Find modelOverrides with type 'region-type'
    this.catalogItem.modelOverrides
      ?.filter(override => override.type === "region-type" && override.id)
      .forEach(override => {
        // Find dimension id with concept or codelist
        const dimId = this.getDimensionWithConceptOrCodelist(override.id!)?.id;

        const dim = this.catalogItem.dimensions?.find(d => d.id === dimId);

        // Set region type to dimension's selected id
        if (dim?.selectedId) regionTypeFromDimension = dim?.selectedId;
      });

    return regionTypeFromDimension;
  }

  /**
   * ... wirte something about this :?
   */
  @computed
  get unitMeasure(): string | undefined {
    // Find first tableColumn which has corresponding modelOverride with type `unit-measure`
    return filterOutUndefined(
      this.catalogItem.modelOverrides
        ?.filter(override => override.type === "unit-measure" && override.id)
        .map(override => {
          // Find dimension/attribute id with concept or codelist
          let dimOrAttr =
            this.getAttributionWithConceptOrCodelist(override.id!) ??
            this.getDimensionWithConceptOrCodelist(override.id!);

          const column = dimOrAttr?.id
            ? this.catalogItem.findColumnByName(dimOrAttr.id)
            : undefined;

          if (column?.uniqueValues.values.length === 1) {
            const codelist = this.getCodelist(
              parseSdmxUrn(dimOrAttr?.localRepresentation?.enumeration)
                ?.resourceId
            );

            const value = column?.uniqueValues.values[0];

            return codelist?.codes?.find(c => c.id === value)?.name ?? value;
          }
        })
    )[0];
  }

  @computed
  get primaryMeasureColumn(): StratumFromTraits<TableColumnTraits> {
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
  get dimensionColumns(): StratumFromTraits<TableColumnTraits>[] {
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
          // Get concept for the current dimension
          const conceptId = dim.conceptIdentity;
          const conceptUrn = parseSdmxUrn(conceptId);
          const concept = this.getConcept(
            conceptUrn?.resourceId,
            conceptUrn?.descendantIds?.[0]
          );
          // Get codelist for current dimension
          const codelistId = dim.localRepresentation?.enumeration;
          const codelistUrn = parseSdmxUrn(codelistId);
          const codelist = this.getCodelist(codelistUrn?.resourceId);

          const conceptOverride = this.catalogItem.modelOverrides.find(
            concept => concept.id === conceptId
          );
          const codelistOverride = this.catalogItem.modelOverrides.find(
            codelist => codelist.id === codelistId
          );

          // Try to find region type
          let regionType: string | undefined;

          // Are any regionTypes present in modelOverrides for the current concept/codelist override
          regionType =
            this.matchRegionType(codelistOverride?.regionType) ??
            this.matchRegionType(conceptOverride?.regionType);

          // Next try regionTypeFromDimension (only if this concept has override type 'region')
          if (
            !isDefined(regionType) &&
            (conceptOverride?.type ?? codelistOverride?.type) === "region"
          )
            regionType = this.matchRegionType(this.regionTypeFromDimension);

          // Try to find valid region type from:
          // - dimension ID
          // - codelist name
          // - codelist ID
          // - concept name?
          // - concept id (the string, not the full URN)

          if (!isDefined(regionType))
            regionType =
              this.matchRegionType(dim.id) ??
              this.matchRegionType(codelist?.name) ??
              this.matchRegionType(codelist?.id) ??
              this.matchRegionType(concept?.name) ??
              this.matchRegionType(concept?.id);

          // Apply regionTypeReplacements (which can replace regionType with a different regionType - using [{find:string, replace:string}] pattern)
          if (
            conceptOverride?.type === "region" ||
            codelistOverride?.type === "region"
          ) {
            const replacement = [
              ...(codelistOverride?.regionTypeReplacements ?? []),
              ...(conceptOverride?.regionTypeReplacements ?? [])
            ].find(r => r.find === regionType)?.replace;
            if (isDefined(replacement)) {
              regionType = replacement;
            }
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
  get timeColumns(): StratumFromTraits<TableColumnTraits>[] {
    return (
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList.timeDimensions?.map(
        dim => {
          const conceptUrn = parseSdmxUrn(dim.conceptIdentity);
          const concept = this.getConcept(
            conceptUrn?.resourceId,
            conceptUrn?.descendantIds?.[0]
          );
          return createStratumInstance(TableColumnTraits, {
            name: dim.id,
            title: concept?.name ?? dim.id,
            type: "time"
          });
        }
      ) ?? []
    );
  }

  @computed
  get attributeColumns(): StratumFromTraits<TableColumnTraits>[] {
    return (
      this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.attributeList?.attributes?.map(
        attr => {
          return createStratumInstance(TableColumnTraits, {
            name: attr.id,
            type: "hidden"
          });
        }
      ) ?? []
    );
  }

  @computed
  get columns() {
    return [
      this.primaryMeasureColumn,
      ...this.dimensionColumns,
      ...this.timeColumns,
      ...this.attributeColumns
    ];
  }

  /**
   * If the unitMeasure column only has a single unique value (all values are the same) is it as a legend title
   */
  @computed
  get defaultStyle() {
    return createStratumInstance(TableStyleTraits, {
      color: createStratumInstance(TableColorStyleTraits, {
        legend: createStratumInstance(LegendTraits, {
          title: this.unitMeasure
        })
      })
    });
  }

  @computed
  get activeStyle() {
    return this.primaryMeasureColumn.name;
  }

  @computed
  get featureInfoTemplate() {
    const regionType = this.catalogItem.activeTableStyle.regionColumn
      ?.regionType;
    if (!regionType) return;

    let template = '<table class="cesium-infoBox-defaultTable">';

    const row = (title: string, value: string) =>
      `<tr><td style="vertical-align: middle">${title}</td><td>${value}</td></tr>`;

    // Get time dimension values
    template += this.timeColumns
      ?.map(col => row(col.title ?? "Time", `{{${col.name}}}`))
      .join(", ");

    // Get region dimension values

    template += row(regionType?.description, `{{${regionType?.nameProp}}}`);

    // Get other dimension values
    template += this.catalogItem.sdmxSelectableDimensions
      ?.filter(d => (d.name || d.id) && !d.disable && d.selectedId)
      .map(d => {
        const selectedOption = d.options?.find(o => o.id === d.selectedId);
        return row((d.name || d.id)!, selectedOption?.name ?? d.selectedId!);
      })
      .join("");

    const primaryMeasureName =
      this.unitMeasure ??
      this.primaryMeasureColumn.title ??
      this.primaryMeasureColumn.name ??
      "Value";

    template +=
      row("", "") +
      row(primaryMeasureName, `{{${this.primaryMeasureColumn.name}}}`);

    // Add timeSeries chart if more than one time observation
    if (
      this.catalogItem.discreteTimes &&
      this.catalogItem.discreteTimes.length > 1
    ) {
      template += `</table><chart id="${this.catalogItem.uniqueId}" title="${this.catalogItem.name}: {{${regionType.nameProp}}}">{{terria.timeSeries.data}}</chart>`;
    }

    return createStratumInstance(FeatureInfoTemplateTraits, { template });
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
  get dimensions(): StratumFromTraits<SdmxDimensionTraits>[] | undefined {
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
          const conceptOverride = this.catalogItem.modelOverrides?.find(
            override => override.id === dim.conceptIdentity
          );

          const codelistOverride = this.catalogItem.modelOverrides?.find(
            override => override.id === dim.localRepresentation?.enumeration
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
                    ?.forEach(regionKey =>
                      regionKey.values?.forEach(value => keys.add(value))
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
          const optionsOverride =
            codelistOverride?.options ?? conceptOverride?.options;
          const options =
            isDefined(optionsOverride) && optionsOverride.length > 0
              ? optionsOverride.map(option => {
                  return { id: option.id, name: option.name };
                })
              : codes?.map(code => {
                  return { id: code.id!, name: code.name };
                });

          if (isDefined(options)) {
            // Use first option as default if no other default is provided
            let selectedId: string | undefined =
              codelistOverride?.allowUndefined ??
              conceptOverride?.allowUndefined
                ? undefined
                : options[0].id;

            // Override selectedId if it a valid option
            const selectedIdOverride =
              codelistOverride?.selectedId ?? conceptOverride?.selectedId;

            if (
              isDefined(selectedIdOverride) &&
              options.find(option => option.id === selectedIdOverride)
            ) {
              selectedId = selectedIdOverride;
            }

            return {
              id: dim.id!,
              name:
                codelistOverride?.name ??
                conceptOverride?.name ??
                concept?.name,
              options: options,
              position: dim.position,
              disable: codelistOverride?.disable ?? conceptOverride?.disable,
              allowUndefined:
                codelistOverride?.allowUndefined ??
                conceptOverride?.allowUndefined,
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

  getDimensionWithConceptOrCodelist(id: string) {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.dimensionList?.dimensions?.find(
      dim =>
        dim.conceptIdentity === id ||
        dim.localRepresentation?.enumeration === id
    );
  }

  getAttributionWithConceptOrCodelist(id: string) {
    return this.sdmxJsonDataflow.dataStructure.dataStructureComponents?.attributeList?.attributes?.find(
      attr =>
        attr.conceptIdentity === id ||
        attr.localRepresentation?.enumeration === id
    );
  }
}

StratumOrder.addLoadStratum(SdmxJsonDataflowStratum.stratumName);
