import { observer } from "mobx-react";
import SearchBox from "../Search/SearchBox";

type DataCatalogSearchProps = {
  searchPlaceholder: string;
  searchText: string;
  onSearchTextChanged: (text: string) => void;
  onDoSearch: () => void;
};

export const DataCatalogSearch = observer((props: DataCatalogSearchProps) => {
  return (
    <SearchBox
      searchText={props.searchText}
      onSearchTextChanged={props.onSearchTextChanged}
      onDoSearch={props.onDoSearch}
      placeholder={props.searchPlaceholder}
    />
  );
});
