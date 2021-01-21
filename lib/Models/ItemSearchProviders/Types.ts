export type IndexBase<QueryType> = {
  type: IndexType;
  load(indexRootUrl: string, valueHint: QueryType): Promise<void>;
  search(query: QueryType): Promise<Set<number>>;
};

export enum IndexType {
  numeric = "numeric",
  enum = "enum",
  text = "text"
}

export const indexTypes = Object.keys(IndexType);
