import { observer } from "mobx-react";
import React, { useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme, withTheme } from "styled-components";

import { GLYPHS, StyledIcon } from "../../Icon";

import ViewState from "../../../ReactViewModels/ViewState";
import {
  StepItem,
  TrainerItem,
  HelpContentItem,
  PaneMode
} from "../../../ReactViewModels/defaultHelpContent";
import Terria from "../../../Models/Terria";
// import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";

import measureElement from "../../HOCs/measureElement";

const parseCustomMarkdownToReact: any = require("../../Custom/parseCustomMarkdownToReact");
const StyledHtml: any = require("../../Map/Panels/HelpPanel/StyledHtml")
  .default;
const CloseButton: any = require("../../Generic/CloseButton").default;

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;
import Select from "../../../Styled/Select";
import { TFunction } from "i18next";

const TrainerBarWrapper = styled(Box)`
  top: 0;
  left: ${p => Number(p.theme.workbenchWidth)}px;
  z-index: ${p => Number(p.theme.frontComponentZIndex) + 100};
`;

// Help with discoverability
const BoxTrainerExpandedSteps = styled(Box)``;

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

const StepText = styled(Text).attrs({})`
  ol,
  ul {
    padding: 0;
    margin: 0;
    // Dislike these arbitrary aligned numbers but leaving it in for now
    padding-left: 17px;
  }
  li {
    padding-left: 8px;
  }
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
      {options.renderDescription && step?.markdownDescription && (
        <>
          {/* {options.comfortable && <Spacing bottom={2} />} */}
          <Spacing bottom={options.comfortable ? 2 : 1} />
          <StepText medium textLightDimmed>
            <StyledHtml
              styledTextProps={{ textDark: false, textLightDimmed: true }}
              content={[
                parseCustomMarkdownToReact(step.markdownDescription).props
                  .children
              ]}
            />
          </StepText>
        </>
      )}
    </Box>
  </Box>
);

const renderOrderedStepList = function(steps: StepItem[]) {
  return steps.map((step: StepItem, index: number) => (
    <React.Fragment key={index}>
      {renderStep(step, index + 1)}
      {index + 1 !== steps.length && <Spacing bottom={3} />}
    </React.Fragment>
  ));
};

interface StepAccordionProps {
  viewState: ViewState;
  selectedTrainerSteps: StepItem[];
  t: TFunction;
  theme: DefaultTheme;
  selectedTrainer: TrainerItem;
  isPeeking: boolean;
  setIsPeeking: (bool: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (bool: boolean) => void;
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
  render() {
    const {
      viewState,
      selectedTrainerSteps,
      t,
      theme,
      selectedTrainer,
      isPeeking,
      setIsPeeking,
      isExpanded,
      setIsExpanded,
      heightFromMeasureElementHOC
    } = this.props;
    return (
      <Box
        css={`
          // min-height: 64px;
        `}
        centered={!isPeeking}
        fullWidth
        justifySpaceBetween
        onMouseOver={() => setIsPeeking(true)}
      >
        {/* Non-peeking step */}
        <Box
          paddedHorizontally={4}
          column
          aria-hidden={isPeeking}
          overflow="hidden"
          css={`
            max-height: 64px;
            pointer-events: none;
          `}
          ref={(component: any) => {
            if (!isExpanded) this.refToMeasure = component;
          }}
        >
          {renderStep(
            selectedTrainerSteps[viewState.currentTrainerStepIndex],
            viewState.currentTrainerStepIndex + 1,
            { renderDescription: false, comfortable: false }
          )}
        </Box>
        {/* peeked version of the box step */}
        {isPeeking && (
          <Box
            paddedHorizontally={4}
            column
            onMouseOver={() => setIsPeeking(true)}
            positionAbsolute
            fullWidth
            css={`
              top: 0;
              padding-bottom: 15px;
              // This padding forces the absolutely positioned box to align with
              // the relative width in its clone
              padding-right: 60px;
            `}
            backgroundColor={theme.textBlack}
            ref={(component: any) => (this.refToMeasure = component)}
            onMouseLeave={() => {
              // We only "unpeek" if user hasn't opted to expand.. confusing
              if (!isExpanded) setIsPeeking(false);
            }}
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
            title={
              isExpanded ? t("trainer.collapseSteps") : t("trainer.expandSteps")
            }
            onBlur={() => {
              if (!isExpanded) setIsPeeking(false);
            }}
            css={"z-index:2;"}
          >
            <StyledIcon
              styledWidth="26px"
              light
              glyph={isExpanded ? GLYPHS.accordionClose : GLYPHS.accordionOpen}
            />
          </RawButton>
        </Box>
        {/* Accordion / child steps? */}
        {isExpanded && (
          <BoxTrainerExpandedSteps
            column
            positionAbsolute
            backgroundColor={theme.textBlack}
            fullWidth
            paddedRatio={4}
            css={`
              // top: 32px;
              padding-bottom: 10px;
              top: ${heightFromMeasureElementHOC}px;
            `}
          >
            {renderOrderedStepList(selectedTrainerSteps)}
            {selectedTrainer.footnote && (
              <>
                <Spacing bottom={3} />
                <Text medium textLightDimmed>
                  <StyledHtml
                    styledTextProps={{ textDark: false, textLightDimmed: true }}
                    content={[
                      parseCustomMarkdownToReact(selectedTrainer.footnote).props
                        .children
                    ]}
                  />
                </Text>
              </>
            )}
          </BoxTrainerExpandedSteps>
        )}
      </Box>
    );
  }
}
const StepAccordion = measureElement(StepAccordionRaw);

interface TrainerBarProps extends WithTranslation {
  viewState: ViewState;
  t: TFunction;
  terria: Terria;
  theme: DefaultTheme;
}

const TrainerBar = observer((props: TrainerBarProps) => {
  const { t, terria, theme, viewState } = props;
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
  const selectedTrainerItem = selectedTrainerItems[trainerItemIndex];
  const selectedTrainerSteps = selectedTrainerItem?.steps;
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
          isExpanded={viewState.trainerBarExpanded}
          setIsExpanded={(bool: boolean) =>
            viewState.setTrainerBarExpanded(bool)
          }
          selectedTrainer={selectedTrainerItem}
          theme={theme}
          t={t}
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
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex - 1
              );
            }}
          >
            {t("general.back")}
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
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex + 1
              );
            }}
          >
            {t("general.next")}
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
