import "!!style-loader!css-loader?sourceMap!./sortable.css";
import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
//@ts-ignore
import Sortable from "react-anything-sortable";
import styled from "styled-components";
import Terria from "../../Models/Terria";
import Workbench from "../../Models/Workbench";
import ViewState from "../../ReactViewModels/ViewState";
import { Ul } from "../../Styled/List";
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

interface IProps {
  terria: Terria;
  workbench: Workbench;
  viewState: ViewState;
}

@observer
class WorkbenchList extends React.Component<IProps> {
  @action.bound
  onSort(
    sortedArray: any,
    currentDraggingSortData: any,
    currentDraggingIndex: any
  ) {
    this.props.workbench.moveItemToIndex(
      currentDraggingSortData,
      currentDraggingIndex
    );
  }

  render() {
    return (
      <StyledUl
        overflowY="auto"
        overflowX="hidden"
        scroll
        paddedHorizontally
        fullWidth
        fullHeight
      >
        {this.props.terria.showSplitter && (
          <WorkbenchSplitScreen terria={this.props.terria} />
        )}
        <Sortable
          onSort={this.onSort}
          direction="vertical"
          dynamic={true}
          css={`
            width: 100%;
          `}
        >
          {this.props.workbench.items.map(item => {
            return (
              <WorkbenchItem
                item={item}
                sortData={item}
                key={item.uniqueId}
                viewState={this.props.viewState}
              />
            );
          })}
        </Sortable>
      </StyledUl>
    );
  }
}

export default WorkbenchList;
