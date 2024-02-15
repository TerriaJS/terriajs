import "!!style-loader!css-loader?sourceMap!./sortable.css";
import { observer } from "mobx-react";
//@ts-ignore
import Sortable from "react-anything-sortable";
import styled from "styled-components";
import { Ul } from "../../Styled/List";
import { useViewState } from "../Context";
import WorkbenchItem from "./WorkbenchItem";
import WorkbenchSplitScreen from "./WorkbenchSplitScreen";

const StyledUl = styled(Ul)`
  margin: 5px 0;
  li {
    &:first-child {
      margin-top: 0;
    }
  }
`;

const WorkbenchList = observer(() => {
  const viewState = useViewState();
  function onSort(
    sortedArray: any,
    currentDraggingSortData: any,
    currentDraggingIndex: any
  ) {
    viewState.terria.workbench.moveItemToIndex(
      currentDraggingSortData,
      currentDraggingIndex
    );
  }

  return (
    <StyledUl
      overflowY="auto"
      overflowX="hidden"
      scroll
      paddedHorizontally
      fullWidth
      fullHeight
      column
    >
      {viewState.terria.showSplitter && (
        <WorkbenchSplitScreen terria={viewState.terria} />
      )}
      <Sortable
        onSort={onSort}
        direction="vertical"
        dynamic
        css={`
          width: 100%;
        `}
      >
        {viewState.terria.workbench.items.map((item) => {
          return (
            <WorkbenchItem
              item={item}
              sortData={item}
              key={item.uniqueId}
              viewState={viewState}
            />
          );
        })}
      </Sortable>
    </StyledUl>
  );
});

export default WorkbenchList;
