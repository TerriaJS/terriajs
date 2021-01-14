import { observer } from "mobx-react";
import Mustache from "mustache";
import React from "react";
import {
  useTranslation,
  WithTranslation,
  withTranslation
} from "react-i18next";
import { useVirtual } from "react-virtual";
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

const SearchResults: React.FC<SearchResultsProps> = props => {
  const { results, selectedResult } = props;
  const parentRef = React.createRef<HTMLDivElement>();
  const list = useVirtual({
    size: results.length,
    parentRef,
    estimateSize: React.useCallback(() => 50, [])
  });

  return (
    <Wrapper>
      <ResultsCount count={results.length} />
      <List ref={parentRef} height={`250px`}>
        <ListInner height={`${list.totalSize}px`}>
          {list.virtualItems.map(({ index, ...row }) => (
            <Result
              result={results[index]}
              isSelected={results[index].id === selectedResult?.id}
              isEven={index % 2 === 0}
              onClick={props.onSelectResult}
              template={props.template}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${row.size}px`,
                transform: `translateY(${row.start}px)`
              }}
            />
          ))}
        </ListInner>
      </List>
    </Wrapper>
  );
};

type ResultProps = {
  result: ItemSearchResult;
  isSelected: boolean;
  isEven: boolean;
  onClick: ResultClickHandler;
  template?: string;
  style: any;
};

export const Result: React.FC<ResultProps> = observer(props => {
  const { result, template, isEven, isSelected, style } = props;
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
      isEven={isEven}
      isSelected={isSelected}
      onClick={onClick}
      style={style}
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

const List = styled.div<{ height: string }>`
  ${p => `height: ${p.height}`};
  width: 100%;
  overflow: auto;
`;

const ListInner = styled.div<{ height: string }>`
  ${p => `height: ${p.height}`};
  width: 100%;
  position: relative;
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
  return (
    <Box
      css={`
        margin-bottom: 1em;
        ${count === 0 ? "align-self: center;" : ""}
      `}
    >
      {t(`itemSearchTool.resultsCount`, { count })}
    </Box>
  );
};

export default withTranslation()(SearchResults);
