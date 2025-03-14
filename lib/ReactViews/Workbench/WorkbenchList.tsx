import "!!style-loader!css-loader?sourceMap!./sortable.css";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import Sortable from "react-anything-sortable";
import styled from "styled-components";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import { Ul } from "../../Styled/List";
import WorkbenchItem from "./WorkbenchItem";
import WorkbenchSplitScreen from "./WorkbenchSplitScreen";

const StyledUl = styled(Ul)`
  margin-top: 5px;
  li {
    &:first-child {
      margin-top: 0;
    }
  }
`;

interface IProps {
  terria: Terria;
  viewState: ViewState;
}

@observer
class WorkbenchList extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    makeObservable(this);
  }

  @action.bound
  onSort(
    sortedArray: any,
    currentDraggingSortData: any,
    currentDraggingIndex: any
  ) {
    this.props.terria.workbench.moveItemToIndex(
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
        fullWidth
        fullHeight
        column
      >
        {this.props.terria.showSplitter && (
          <WorkbenchSplitScreen terria={this.props.terria} />
        )}
        <Sortable
          onSort={this.onSort}
          direction="vertical"
          dynamic
          css={`
            width: 100%;
          `}
        >
          {this.props.terria.workbench.items.map((item) => {
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
