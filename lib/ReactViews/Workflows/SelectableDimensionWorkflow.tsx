import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import WorkflowPanel from "../../Styled/WorkflowPanel";
import { DimensionSelector } from "../Workbench/Controls/DimensionSelectorSection";
import Legend from "../Workbench/Controls/Legend";

export type PropsType = {
  viewState: ViewState;
};

const SelectabelDimensionWorkflow: React.FC<PropsType> = observer(
  ({ viewState }: PropsType) => {
    const terria = viewState.terria;
    const [t] = useTranslation();
    return terria.selectableDimensionWorkflow ? (
      <WorkflowPanel
        viewState={viewState}
        icon={terria.selectableDimensionWorkflow.icon}
        title={terria.selectableDimensionWorkflow.name}
        closeButtonText={t("compare.done")}
        onClose={action(() => {
          terria.selectableDimensionWorkflow = undefined;
        })}
      >
        {terria.selectableDimensionWorkflow.selectableDimensions.map(
          (dim, i) => (
            <Box
              rounded
              paddedRatio={2}
              styledMargin="5px 5px 0 5px"
              css={`
                color: ${(p: any) => p.theme.textLight};
                background: ${(p: any) => p.theme.darkWithOverlay};
              `}
              displayInlineBlock
            >
              <DimensionSelector
                key={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${dim.id}-fragment`}
                id={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${dim.id}`}
                dim={dim}
              />
            </Box>
          )
        )}
        {terria.selectableDimensionWorkflow.showLegend ? (
          <Box padded paddedRatio={2}>
            <Text textLight>
              <Legend item={terria.selectableDimensionWorkflow.item} />
            </Text>
          </Box>
        ) : null}
      </WorkflowPanel>
    ) : null;
  }
);

export default SelectabelDimensionWorkflow;
