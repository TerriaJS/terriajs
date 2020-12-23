import { observer } from "mobx-react";
import Mustache from "mustache";
import React, { memo } from "react";
import {
  useTranslation,
  WithTranslation,
  withTranslation
} from "react-i18next";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import styled from "styled-components";
import { ItemSearchResult } from "../../../Models/ItemSearchProvider";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";

const Box: any = require("../../../Styled/Box").default;

export interface SearchResultsProps extends WithTranslation {
  results: ItemSearchResult[];
  selectedResult?: ItemSearchResult;
  template?: string;
  onSelectResult: ResultClickHandler;
}

type ResultClickHandler = (result: ItemSearchResult) => void;

export { FixedSizeList as List } from "react-window";

const SearchResults: React.FC<SearchResultsProps> = props => {
  const { results } = props;
  return (
    <Wrapper>
      <ResultsCount count={results.length} />
      {results.length > 0 && (
        <AutoSizer>
          {size => (
            <List
              width={size.width}
              height={size.height - 20}
              itemSize={50}
              itemCount={results.length}
              itemData={{
                onClick: props.onSelectResult,
                results,
                selectedResult: props.selectedResult,
                template: props.template
              }}
            >
              {ResultItem}
            </List>
          )}
        </AutoSizer>
      )}
    </Wrapper>
  );
};

type ResultItemProps = {
  index: number;
  data: {
    onClick: ResultClickHandler;
    results: ItemSearchResult[];
    selectedResult?: ItemSearchResult;
    template?: string;
  };
  style: any;
};

const ResultItem: React.FC<ResultItemProps> = memo(props => {
  const { index, data, ...restProps } = props;
  const { results, selectedResult, template, onClick } = data;
  const result = results[index];
  const isSelected = selectedResult ? result.id === selectedResult.id : false;
  return (
    <Result
      result={result}
      isSelected={isSelected}
      template={template}
      isEven={index % 2 === 0}
      onClick={onClick}
      {...restProps}
    />
  );
});

type ResultProps = {
  result: ItemSearchResult;
  isSelected: boolean;
  template?: string;
  style: any;
  isEven: boolean;
  onClick: ResultClickHandler;
};

export const Result: React.FC<ResultProps> = observer(props => {
  const { result, template, style, isEven, isSelected } = props;
  const content = template
    ? parseCustomMarkdownToReact(Mustache.render(template, result.properties))
    : result.id;
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = e => {
    try {
      props.onClick(result);
    } finally {
      e.preventDefault();
    }
  };
  return (
    <ClickableItem
      role="button"
      style={style}
      isEven={isEven}
      isSelected={isSelected}
      onClick={onClick}
    >
      {content}
    </ClickableItem>
  );
});

const ClickableItem = styled.a<{ isEven: boolean; isSelected: boolean }>`
  display: block;
  box-sizing: border-box;
  padding: 5px 10px;
  cursor: pointer;
  ${p =>
    `background-color: ${
      p.isSelected
        ? p.theme.toolPrimaryColor
        : p.isEven
        ? p.theme.dark
        : p.theme.darkLighter
    };`}
`;

const Wrapper = styled(Box).attrs({ column: true, flex: 1 })`
  > :only-child {
    flex: 1;
    align-self: center;
    align-items: center;
  }
`;

export const ResultsCount: React.FC<{ count: number }> = ({ count }) => {
  const [t] = useTranslation();
  const inflection = count === 0 ? "zero" : count === 1 ? "one" : "many";
  return (
    <Box
      css={`
        margin-bottom: 1em;
      `}
    >
      {t(`itemSearchTool.resultsCount.${inflection}`, { count })}
    </Box>
  );
};

export default withTranslation()(SearchResults);
