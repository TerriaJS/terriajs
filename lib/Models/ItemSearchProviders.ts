import Constructor from "../Core/Constructor";
import ItemSearchProvider from "./ItemSearchProvider";
import IndexedItemSearchProvider from "./ItemSearchProviders/IndexedItemSearchProvider";

const ItemSearchProviders: Map<
  string,
  Constructor<ItemSearchProvider>
> = new Map([["indexed", IndexedItemSearchProvider]]);

export default ItemSearchProviders;
