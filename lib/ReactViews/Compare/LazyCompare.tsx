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
    return terria.compareConfig ? (
      <Suspense fallback={<></>}>
        <Compare viewState={viewState} compareConfig={terria.compareConfig} />
      </Suspense>
    ) : null;
  }
);

export default LazyCompare;
