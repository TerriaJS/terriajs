import { action } from "mobx";
import { observer } from "mobx-react";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import AnimatedSpinnerIcon from "../../Styled/AnimatedSpinnerIcon";
import { GLYPHS } from "../../Styled/Icon";
import WorkflowPanel from "../../Styled/WorkflowPanel";

const Compare = React.lazy(() => import("./Compare"));

export type PropsType = {
  viewState: ViewState;
};

const LazyCompare: React.FC<PropsType> = observer(
  ({ viewState }: PropsType) => {
    const terria = viewState.terria;
    const [t] = useTranslation();
    return terria.compareConfig?.showCompare ? (
      <WorkflowPanel
        viewState={viewState}
        icon={GLYPHS.compare}
        title={t("compare.title")}
        closeButtonText={t("compare.done")}
        onClose={action(() => {
          terria.compareConfig = undefined;
        })}
      >
        <Suspense fallback={<Loading />}>
          <Compare viewState={viewState} compareConfig={terria.compareConfig} />
        </Suspense>
      </WorkflowPanel>
    ) : null;
  }
);

const Loading: React.FC<{}> = () => {
  const theme = useTheme();
  return (
    <div
      css={`
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: center;
      `}
    >
      <AnimatedSpinnerIcon
        fillColor={theme.greyLighter}
        styledWidth="24px"
        styledHeight="25px"
      />
    </div>
  );
};

export default LazyCompare;
