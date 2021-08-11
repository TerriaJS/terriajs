import Constructor from "../../Core/Constructor";
import ItemSearchProvider from "./ItemSearchProvider";
import IndexedItemSearchProvider from "./IndexedItemSearchProvider";

export const ItemSearchProviders: Map<
  string,
  Constructor<ItemSearchProvider>
> = new Map([["indexed", IndexedItemSearchProvider]]);

export function registerItemSearchProvider(
  type: string,
  providerClass: Constructor<ItemSearchProvider>
) {
  ItemSearchProviders.set(type, providerClass);
}
