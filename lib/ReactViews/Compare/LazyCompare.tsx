import { action } from "mobx";
import { observer } from "mobx-react";
import React, { Suspense } from "react";
import ViewState from "../../ReactViewModels/ViewState";

const Compare = React.lazy(() => import("./Compare"));

export type PropsType = {
  viewState: ViewState;
};

const LazyCompare: React.FC<PropsType> = observer(
  ({ viewState }: PropsType) => {
    const terria = viewState.terria;
    const leftItemId = terria.compareLeftItemId;
    const rightItemId = terria.compareRightItemId;
    return terria.showSplitter ? (
      <Suspense fallback={<></>}>
        <Compare
          viewState={viewState}
          leftItemId={leftItemId}
          rightItemId={rightItemId}
          changeLeftItem={action(id => {
            terria.compareLeftItemId = id;
          })}
          changeRightItem={action(id => {
            terria.compareRightItemId = id;
          })}
          onClose={action(() => {
            terria.showSplitter = false;
            terria.compareLeftItemId = undefined;
            terria.compareRightItemId = undefined;
          })}
        />
      </Suspense>
    ) : null;
  }
);

export default LazyCompare;
