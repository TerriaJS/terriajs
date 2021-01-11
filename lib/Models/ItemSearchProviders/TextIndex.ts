import MiniSearch, { Options as MiniSearchOptions } from "minisearch";
import joinUrl from "./joinUrl";

const loadText = require("../../Core/loadText");

type TextSearchQuery = string;

export default class TextIndex {
  readonly type = "text";

  private miniSearchIndex?: MiniSearch;

  constructor(readonly url: string) {}

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

  search(value: TextSearchQuery): Set<number> {
    if (!this.miniSearchIndex) throw new Error(`Text index not loaded`);
    const results = this.miniSearchIndex.search(value);
    const ids = new Set(results.map(r => r.id));
    return ids;
  }
}
