import { Document } from "flexsearch";
import { action, observable, ObservableMap } from "mobx";
import loadJson from "../../Core/loadJson";
import CatalogIndexReferenceTraits from "../../Traits/TraitsClasses/CatalogIndexReferenceTraits";
import CatalogIndexReference from "../Catalog/CatalogReferences/CatalogIndexReference";
import CommonStrata from "../Definition/CommonStrata";
import updateModelFromJson from "../Definition/updateModelFromJson";
import Terria from "../Terria";
import SearchResult from "./SearchResult";

export interface CatalogIndexFile {
  [id: string]: CatalogIndexReferenceTraits;
}

export interface ModelIndex {
  name: string;
  knownContainerUniqueIds: string[];
}

export default class CatalogIndex {
  private _models: Map<string, CatalogIndexReference> | undefined;

  get models() {
    return this._models;
  }
  private _searchIndex: any; // Flex-search document index

  get searchIndex() {
    return this._searchIndex;
  }

  readonly loadPromise: Promise<void>;

  constructor(private readonly terria: Terria, private readonly url: string) {
    this.loadPromise = this.loadCatalogIndex();
  }

  /** The catalog index is loaded automatically on startup.
   * It is loaded the first time loadInitSources is called (see Terria.forceLoadInitSources) */
  @action
  private async loadCatalogIndex() {
    // Load catalog index
    try {
      const index = (await loadJson(this.url)) as CatalogIndexFile;
      this._models = new Map<string, CatalogIndexReference>();

      /**
       * https://github.com/nextapps-de/flexsearch
       * Create search index for fields "name" and "description"
       *  - tokenize property
       *    - "full" = index every possible combination
       *    - "strict" = index whole words
       *  - resolution property = score resolution
       */
      this._searchIndex = new Document({
        document: {
          id: "id",
          index: [
            {
              field: "name",
              tokenize: "full",
              resolution: 9
            },
            {
              field: "description",
              tokenize: "strict",
              resolution: 1
            }
          ]
        }
      });

      const indexModels = Object.entries(index);

      for (let idx = 0; idx < indexModels.length; idx++) {
        const [id, model] = indexModels[idx];
        const reference = new CatalogIndexReference(id, this.terria);
        updateModelFromJson(reference, CommonStrata.definition, model);

        // Add model to CatalogIndexReference map
        this._models!.set(id, reference);

        // Add document to search index
        this._searchIndex.add({
          id,
          name: model.name ?? "",
          description: model.description ?? ""
        });
      }
    } catch (error) {
      this.terria.raiseErrorToUser(error, "Failed to load catalog index");
    }
  }

  public search(q: string) {
    const results: SearchResult[] = [];
    /** Example matches object
    ```json
    [
      {
        "field": "name",
        "result": [
          "some-id-1"
        ]
      },
      {
        "field": "description",
        "result": [
          "some-id-2"
        ]
      }
    ]
    ```
*/
    const matches = this.searchIndex.search(q);
    const matchedIds = new Set<string>();
    matches.forEach((fieldResult: any) => {
      fieldResult.result.forEach((id: string) => {
        const indexReference = this.models?.get(id);
        if (indexReference && !matchedIds.has(id)) {
          matchedIds.add(id);
          results.push(
            new SearchResult({
              name: indexReference.name ?? indexReference.uniqueId,
              catalogItem: indexReference
            })
          );
        }
      });
    });

    return results;
  }
}
