import React from "react";
import Loader from "../Loader";
import { observer } from "mobx-react";
const Text = require("../../Styled/Text").default;
const BoxSpan = require("../../Styled/Box").BoxSpan;

interface SearchHeaderProps {
  searchResults: { [key: string]: any };
  isWaitingForSearchToStart: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = observer(
  (props: SearchHeaderProps) => {
    if (props.searchResults.isSearching || props.isWaitingForSearchToStart) {
      return (
        <div key="loader">
          <Loader boxProps={{ padded: true }} />
        </div>
      );
    } else if (props.searchResults.message) {
      return (
        <BoxSpan paddedRatio={2}>
          <Text key="message">{props.searchResults.message}</Text>
        </BoxSpan>
      );
    } else {
      return null;
    }
  }
);

export default SearchHeader;
