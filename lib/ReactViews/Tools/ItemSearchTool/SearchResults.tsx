import { observer } from "mobx-react";
import Mustache from "mustache";
import React, { useState } from "react";
import {
  useTranslation,
  WithTranslation,
  withTranslation
} from "react-i18next";
import { useVirtual } from "react-virtual";
import styled from "styled-components";
import SearchableItemMixin from "../../../ModelMixins/SearchableItemMixin";
import { ItemSearchResult } from "../../../Models/ItemSearchProvider";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";
import { HideAllResults, HighlightResults } from "./Actions";

const Box: any = require("../../../Styled/Box").default;
const Button = require("../../../Styled/Button").default;

type Selection =
  | { is: "none" }
  | { is: "highlightAll" }
  | { is: "hideAll" }
  | { is: "singleResult"; result: ItemSearchResult };

export interface SearchResultsProps extends WithTranslation {
  item: SearchableItemMixin.Instance;
  results: ItemSearchResult[];
  template?: string;
}

type ResultClickHandler = (result: ItemSearchResult) => void;

const SearchResults: React.FC<SearchResultsProps> = props => {
  const { item, results } = props;
  const [currentSelection, setCurrentSelection] = useState<Selection>({
    is: "none"
  });
  const selectedResult =
    currentSelection.is === "singleResult"
      ? currentSelection.result
      : undefined;
  const parentRef = React.createRef<HTMLDivElement>();
  const list = useVirtual({
    size: results.length,
    parentRef,
    estimateSize: React.useCallback(() => 50, [])
  });
  const [t] = useTranslation();

  const toggleSelection = (newSelection: Selection) => {
    currentSelection.is === newSelection.is &&
    (currentSelection as any).result === (newSelection as any).result
      ? setCurrentSelection({ is: "none" })
      : setCurrentSelection(newSelection);
  };

  return (
    <Wrapper>
      <ResultsCount count={results.length} />
      <ActionMenu>
        <ActionButton
          selected={currentSelection.is === "highlightAll"}
          onClick={() => toggleSelection({ is: "highlightAll" })}
        >
          {t("itemSearchTool.actions.highlightAll")}
        </ActionButton>
        <ActionButton
          selected={currentSelection.is === "hideAll"}
          onClick={() => toggleSelection({ is: "hideAll" })}
        >
          {t("itemSearchTool.actions.hideAll")}
        </ActionButton>
      </ActionMenu>
      <List ref={parentRef} height={`250px`}>
        <ListInner height={`${list.totalSize}px`}>
          {list.virtualItems.map(({ index, ...row }) => (
            <Result
              key={results[index].id}
              result={results[index]}
              isSelected={results[index].id === selectedResult?.id}
              isEven={index % 2 === 0}
              onClick={() =>
                toggleSelection({ is: "singleResult", result: results[index] })
              }
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
      {currentSelection.is === "highlightAll" && (
        <HighlightResults item={item} results={results} />
      )}
      {currentSelection.is === "singleResult" && (
        <HighlightResults item={item} results={[currentSelection.result]} />
      )}
      {currentSelection.is === "hideAll" && (
        <HideAllResults item={item} results={results} />
      )}
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

const ActionButton = styled(Button).attrs(props => ({
  primary: props.selected,
  secondary: !props.selected
}))`
  min-height: 20px;
  padding: 1em;
  padding-top: 2px;
  padding-bottom: 2px;
  border-radius: 5px;
`;

const ActionMenu = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5em;
  background-color: ${p => p.theme.charcoalGrey};

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;

  > ${ActionButton}:first-child {
    margin-right: 1em;
  }
`;

export default withTranslation()(SearchResults);
