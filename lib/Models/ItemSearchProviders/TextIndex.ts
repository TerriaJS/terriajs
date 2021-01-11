import MiniSearch, { Options as MiniSearchOptions } from "minisearch";
import joinUrl from "./joinUrl";

const loadText = require("../../Core/loadText");

// Text search query
type TextSearchQuery = string;

/**
 * An index for searching arbirtray text.
 *
 * We use the Minisearch library for indexing and searching free text.  The
 * index files contains a serialized JSON representation of the Minisearch
 * instance and the options used to construct the Minisearch instance.
 */
export default class TextIndex {
  readonly type = "text";

  private miniSearchIndex?: MiniSearch;

  /**
   * Construct the search index.
   *
   * @param url Url of the text index file
   */
  constructor(readonly url: string) {}

  /**
   * Loads the text index.
   *
   * @param indexRootUrl The URL of the index root directory.
   * @param _valueHint Ignored for TextIndex.
   */
  async load(indexRootUrl: string, _valueHint: TextSearchQuery): Promise<void> {
    if (this.miniSearchIndex) return;
    this.miniSearchIndex = await loadText(joinUrl(indexRootUrl, this.url))
      .then((text: string) => JSON.parse(text))
      .then((json: any) =>
        MiniSearch.loadJS(
          json.index as any,
          (json.options as any) as MiniSearchOptions
        )
      );
  }

  /**
   * Search the text index for the given value.
   *
   * @param value The value to be searched.
   * @param return The IDs of objects matching the search text.
   */
  search(value: TextSearchQuery): Set<number> {
    if (!this.miniSearchIndex) throw new Error(`Text index not loaded`);
    const results = this.miniSearchIndex.search(value);
    const ids = new Set(results.map(r => r.id));
    return ids;
  }
}
