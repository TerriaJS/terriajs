import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import { filterSelectableDimensions } from "../../Models/SelectableDimensions/SelectableDimensions";
import ViewState from "../../ReactViewModels/ViewState";
import WorkflowPanel from "../../Styled/WorkflowPanel";
import { Container, InfoText } from "../Compare/Compare";
import { Panel, PanelBody } from "../Compare/Panel";
import { DimensionSelector } from "../Workbench/Controls/DimensionSelectorSection";
import WorkbenchItemControls, {
  hideAllControls
} from "../Workbench/Controls/WorkbenchItemControls";

export type PropsType = {
  viewState: ViewState;
};

const SelectableDimensionWorkflow: React.FC<PropsType> = observer(
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
        <Container>
          <Panel>
            <InfoText>Edit the Style!</InfoText>
          </Panel>
          <Panel title={getName(terria.selectableDimensionWorkflow.item)}>
            <PanelBody>
              <WorkbenchItemControls
                item={terria.selectableDimensionWorkflow.item}
                viewState={viewState}
                controls={{
                  ...hideAllControls,
                  opacity: true,
                  timer: true,
                  dateTime: true
                }}
              />
            </PanelBody>
          </Panel>
          {terria.selectableDimensionWorkflow.selectableDimensions.map(
            (groupDim, i) => (
              <Panel
                title={groupDim.name ?? groupDim.id}
                key={groupDim.name ?? groupDim.id}
                isOpen={groupDim.isOpen ?? true}
                onToggle={groupDim.onToggle}
                collapsible={true}
              >
                <PanelBody>
                  {filterSelectableDimensions()(
                    groupDim.selectableDimensions
                  ).map(childDim => (
                    <DimensionSelector
                      key={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${childDim.id}-fragment`}
                      id={`${terria.selectableDimensionWorkflow?.item.uniqueId}-${childDim.id}`}
                      dim={childDim}
                    />
                  ))}
                </PanelBody>
              </Panel>
            )
          )}
        </Container>
      </WorkflowPanel>
    ) : null;
  }
);

export default SelectableDimensionWorkflow;
