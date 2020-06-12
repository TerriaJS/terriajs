import { observer } from "mobx-react";
import React, { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme, withTheme } from "styled-components";

import { GLYPHS, StyledIcon } from "../../Icon";

import ViewState from "../../../ReactViewModels/ViewState";
import {
  StepItem,
  HelpContentItem,
  PaneMode
} from "../../../ReactViewModels/defaultHelpContent";
import Terria from "../../../Models/Terria";

import measureElement from "../../HOCs/measureElement";

const CloseButton: any = require("../../Generic/CloseButton").default;

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;
import Select from "../../../Styled/Select";

const TrainerBarWrapper = styled(Box)`
  top: 0;
  left: ${p => Number(p.theme.workbenchWidth)}px;
  z-index: ${p => Number(p.theme.frontComponentZIndex) + 100};
`;

const getSelectedTrainerFromHelpContent = (
  viewState: ViewState,
  helpContent: HelpContentItem[]
) => {
  const selected = viewState.selectedTrainerItem;
  const found = helpContent.find(item => item.itemName === selected);
  // Try and find the item that we selected, otherwise find the first trainer pane
  return found || helpContent.find(item => item.paneMode === PaneMode.trainer);
};

// Ripped from StyledHtml.jsx
const Numbers = styled(Text)`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  background-color: ${props => props.theme.textLight};
`;

const renderStep = (
  step: StepItem,
  number: number,
  options: {
    renderDescription: boolean;
    comfortable: boolean;
  } = {
    renderDescription: true,
    comfortable: false
  }
) => (
  <Box key={number} paddedVertically>
    <Box alignItemsFlexStart>
      <Numbers textDarker textAlignCenter darkBg>
        {number}
      </Numbers>
      <Spacing right={3} />
    </Box>
    <Box column>
      <Text medium textLight>
        {step.title}
      </Text>
      {options.renderDescription && step?.description && (
        <>
          {options.comfortable && <Spacing bottom={2} />}
          <Text medium textLightDimmed>
            {step.description}
          </Text>
        </>
      )}
    </Box>
  </Box>
);

const renderOrderedStepList = function(steps: StepItem[]) {
  return steps.map((step: StepItem, index: number) => (
    <>
      {renderStep(step, index + 1)}
      {index + 1 !== steps.length && <Spacing bottom={3} />}
    </>
  ));
};

interface StepAccordionProps {
  viewState: ViewState;
  selectedTrainerSteps: StepItem[];
  theme: DefaultTheme;
  isPeeking: boolean;
  setIsPeeking: (bool: boolean) => void;
  heightFromMeasureElementHOC: number | null;
}
interface StepAccordionState {
  isExpanded: boolean;
}

// Originally written as a SFC but measureElement only supports class components at the moment
class StepAccordionRaw extends React.Component<
  StepAccordionProps,
  StepAccordionState
> {
  refToMeasure: any;
  constructor(props: StepAccordionProps) {
    super(props);
    this.state = {
      isExpanded: false
    };
  }
  render() {
    const {
      viewState,
      selectedTrainerSteps,
      theme,
      isPeeking,
      setIsPeeking,
      heightFromMeasureElementHOC
    } = this.props;
    const { isExpanded } = this.state;
    // const setIsPeeking = (bool: any) => this.setState({ isPeeking: bool });
    const setIsExpanded = (bool: any) => this.setState({ isExpanded: bool });
    // const [isPeeking, setIsPeeking] = useState(false);
    // const [isExpanded, setIsExpanded] = useState(false);
    return (
      <Box fullWidth justifySpaceBetween>
        <Box
          paddedHorizontally={3}
          column
          onMouseOver={() => setIsPeeking(true)}
          // onMouseOut={() => setIsPeeking(false)}
          aria-hidden={isPeeking}
          overflow="hidden"
          css={`
            max-height: 64px;
          `}
        >
          {renderStep(
            selectedTrainerSteps[viewState.currentTrainerStepIndex],
            viewState.currentTrainerStepIndex + 1,
            { renderDescription: false, comfortable: false }
          )}
        </Box>
        {isPeeking && (
          <Box
            paddedHorizontally={3}
            column
            onMouseOver={() => setIsPeeking(true)}
            positionAbsolute
            fullWidth
            css={`
              padding-bottom: 15px;
              padding-right: 45px;
            `}
            backgroundColor={theme.textBlack}
            ref={(component: any) => (this.refToMeasure = component)}
            // onMouseOut={() => setIsPeeking(false)}
          >
            {renderStep(
              selectedTrainerSteps[viewState.currentTrainerStepIndex],
              viewState.currentTrainerStepIndex + 1,
              { renderDescription: true, comfortable: true }
            )}
          </Box>
        )}
        <Box paddedHorizontally={2}>
          <RawButton
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseOver={() => setIsPeeking(true)}
            onFocus={() => setIsPeeking(true)}
            // onMouseOut={() => setIsPeeking(false)}
            // onBlur={() => setIsPeeking(false)}
            css={"z-index:2;"}
          >
            <StyledIcon styledWidth="26px" light glyph={GLYPHS.upDown} />
          </RawButton>
        </Box>
        {/* Accordion / child steps? */}
        {isExpanded && (
          <Box
            column
            positionAbsolute
            backgroundColor={theme.textBlack}
            fullWidth
            paddedRatio={3}
            css={`
              // top: 32px;
              top: ${heightFromMeasureElementHOC}px;
            `}
          >
            {renderOrderedStepList(selectedTrainerSteps)}
          </Box>
        )}
      </Box>
    );
  }
}
const StepAccordion = measureElement(StepAccordionRaw);

interface TrainerBarProps extends WithTranslation {
  viewState: ViewState;
  terria: Terria;
  theme: DefaultTheme;
}

const TrainerBar = observer((props: TrainerBarProps) => {
  const { terria, theme, viewState } = props;
  const { helpContent } = terria.configParameters;

  // All these null guards are because we are rendering based on nested
  // map-owner defined (helpContent)content which could be malformed
  if (!viewState.trainerBarVisible || !helpContent) {
    return null;
  }

  const selectedTrainer = getSelectedTrainerFromHelpContent(
    viewState,
    helpContent
  );
  const selectedTrainerItems = selectedTrainer?.trainerItems;

  if (!selectedTrainerItems) {
    return null;
  }

  const trainerItemIndex =
    viewState.currentTrainerItemIndex <= selectedTrainerItems.length
      ? viewState.currentTrainerItemIndex
      : 0;
  const selectedTrainerSteps = selectedTrainerItems[trainerItemIndex]?.steps;
  if (!selectedTrainerSteps) {
    return null;
  }

  return (
    <TrainerBarWrapper
      centered
      positionAbsolute
      styledWidth={`calc(100% - ${Number(theme.workbenchWidth)}px)`}
      onClick={() => viewState.setTopElement("TrainerBar")}
    >
      <Box
        fullWidth
        fullHeight
        centered
        justifySpaceBetween
        backgroundColor={theme.textBlack}
      >
        {/* Trainer Items Dropdown */}
        <Box css={"min-height: 64px;"}>
          {/* <Spacing right={6} /> */}
          <Select
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              viewState.setCurrentTrainerItemIndex(Number(e.target.value))
            }
            value={viewState.currentTrainerItemIndex}
            // css={"min-width: 280px;"}
          >
            {selectedTrainerItems.map((item, index) => (
              <option value={index}>{item.title}</option>
            ))}
          </Select>
          {/* <Spacing right={8} /> */}
        </Box>

        {/* Trainer Steps within a Trainer Item */}

        <StepAccordion
          viewState={viewState}
          selectedTrainerSteps={selectedTrainerSteps}
          isPeeking={viewState.trainerBarPeeking}
          setIsPeeking={(bool: boolean) => viewState.setTrainerBarPeeking(bool)}
          theme={theme}
        />
        <Spacing right={4} />

        {/* Navigation & Close */}
        <Box>
          <Button
            secondary
            shortMinHeight
            css={`
              background: transparent;
              color: ${theme.textLight};
              border-color: ${theme.textLight};
              ${viewState.currentTrainerStepIndex === 0 &&
                `visibility: hidden;`}
            `}
            onClick={() => {
              viewState.setTrainerBarPeeking(false);
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex - 1
              );
            }}
          >
            Back
          </Button>
          <Spacing right={2} />
          <Button
            primary
            shortMinHeight
            css={`
              ${viewState.currentTrainerStepIndex ===
                selectedTrainerSteps.length - 1 && `visibility: hidden;`}
            `}
            onClick={() => {
              viewState.setTrainerBarPeeking(false);
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex + 1
              );
            }}
          >
            Next
          </Button>
          <Spacing right={5} />
          <Box centered>
            <CloseButton
              noAbsolute
              // topRight
              color={theme.textLight}
              onClick={() => viewState.setTrainerBarVisible(false)}
            />
          </Box>
          <Spacing right={6} />
        </Box>
      </Box>
    </TrainerBarWrapper>
  );
});

export default withTranslation()(withTheme(TrainerBar));
