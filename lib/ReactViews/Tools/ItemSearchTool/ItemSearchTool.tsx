import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { WithTranslation, withTranslation } from "react-i18next";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../../../Models/ItemSearchProvider";
import ViewState from "../../../ReactViewModels/ViewState";
import { Frame, Main } from "../ToolModal";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import ErrorComponent from "./ErrorComponent";
import SearchForm from "./SearchForm";
import Loading from "./Loading";
import SearchResults from "./SearchResults";
import BackButton from "./BackButton";
import HighlightResult from "./HighlightResult";

const Box: any = require("../../../Styled/Box").default;

export interface PropsType extends WithTranslation {
  item: SearchableItemMixin.Instance;
  itemSearchProvider: ItemSearchProvider;
  viewState: ViewState;
  afterLoad?: () => void;
}

type State =
  | { is: "loadingParameters" }
  | { is: "error"; error: Error }
  | { is: "search" }
  | { is: "results"; results: ItemSearchResults };

type ParameterValues = Record<string, any>;
type ItemSearchResults = ItemSearchResult[];

const ItemSearchTool: React.FC<PropsType> = observer(props => {
  const { viewState, item, itemSearchProvider, t } = props;
  const itemName = CatalogMemberMixin.isMixedInto(item) ? item.name : "Item";

  const [state, setState] = useState<State>({ is: "loadingParameters" });
  const [parameters, setParameters] = useState<ItemSearchParameter[]>([]);
  const [parameterValues, setParameterValues] = useState<ParameterValues>({});
  const [selectedResult, setSelectedResult] = useState<
    ItemSearchResult | undefined
  >();

  useEffect(
    function loadParameters() {
      itemSearchProvider
        .initialize()
        .then(() =>
          itemSearchProvider.describeParameters().then(parameters => {
            setState({ is: "search" });
            setParameters(parameters);
            setParameterValues({});
          })
        )
        .catch((error: Error) => {
          console.warn(error);
          setState({
            is: "error",
            error
          });
        })
        .finally(() => props.afterLoad?.());
    },
    [itemSearchProvider]
  );

  const setResults = (
    parameterValues: Record<string, any>,
    results: ItemSearchResults
  ) => {
    setParameterValues(parameterValues);
    setState({ is: "results", results });
  };

  const searchAgain = () => {
    setState({ is: "search" });
    setSelectedResult(undefined);
  };

  const loadIndexForParameter = itemSearchProvider.premptivelyLoadIndexForParameter?.bind(
    itemSearchProvider
  );

  return (
    <>
      <Frame
        viewState={viewState}
        title={t("itemSearchTool.title", { itemName })}
      >
        <Main textLight light>
          <Box
            centered
            css={`
              text-align: center;
            `}
          >
            {state.is === "loadingParameters" && (
              <Loading>{t("itemSearchTool.loading")}</Loading>
            )}
            {state.is === "error" && (
              <ErrorComponent>{t("itemSearchTool.loadError")}</ErrorComponent>
            )}
            {state.is === "search" && parameters.length === 0 && (
              <ErrorComponent>
                {t("itemSearchTool.noParameters")}
              </ErrorComponent>
            )}
          </Box>
          {state.is === "search" && parameters.length > 0 && (
            <SearchForm
              itemSearchProvider={itemSearchProvider}
              parameters={parameters}
              values={parameterValues}
              onResults={setResults}
              onValueChange={loadIndexForParameter}
            />
          )}
          {state.is === "results" && (
            <SearchResults
              results={state.results}
              template={item.search.resultTemplate}
              selectedResult={selectedResult}
              onSelectResult={setSelectedResult}
            />
          )}
          {state.is === "results" && (
            <BackButton onClick={searchAgain}>
              {t("itemSearchTool.backBtnText")}
            </BackButton>
          )}
        </Main>
      </Frame>
      {selectedResult && (
        <HighlightResult item={item} result={selectedResult} />
      )}
    </>
  );
});

export default withTranslation()(ItemSearchTool);
