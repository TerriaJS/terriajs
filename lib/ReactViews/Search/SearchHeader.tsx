import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
import SearchProviderResult from "../../Models/SearchProviders/SearchProviderResults";
import { BoxSpan } from "../../Styled/Box";
import Text from "../../Styled/Text";
import Loader from "../Loader";

interface SearchHeaderProps {
  searchResult: SearchProviderResult;
}

const SearchHeader: FC<SearchHeaderProps> = observer(
  (props: SearchHeaderProps) => {
    const { i18n } = useTranslation();

    if (
      props.searchResult.state === "searching" ||
      props.searchResult.state === "waiting"
    ) {
      return (
        <div key="loader">
          <Loader boxProps={{ padded: true }} />
        </div>
      );
    } else if (props.searchResult.message) {
      return (
        <BoxSpan paddedRatio={2}>
          <Text key="message">
            {applyTranslationIfExists(
              props.searchResult.message.content,
              i18n,
              props.searchResult.message.params
            )}
          </Text>
        </BoxSpan>
      );
    } else {
      return null;
    }
  }
);

export default SearchHeader;
