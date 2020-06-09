import { observer } from "mobx-react";
// import React, { useState } from "react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, useTheme, withTheme } from "styled-components";

import ViewState from "../../../ReactViewModels/ViewState";
import {
  HelpContentItem,
  PaneMode
} from "../../../ReactViewModels/defaultHelpContent";
import Terria from "../../../Models/Terria";

const CloseButton: any = require("../../Generic/CloseButton").default;

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
// const RawButton: any = require("../../../Styled/Button").RawButton;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;
import Select from "../../../Styled/Select";

interface TrainerBarProps extends WithTranslation {
  viewState: ViewState;
  terria: Terria;
  theme: DefaultTheme;
}

const TrainerBarWrapper = styled(Box)`
  position: absolute;
  top: 0;
  left: ${p => Number(p.theme.workbenchWidth)}px;
  z-index: ${p => Number(p.theme.frontComponentZIndex) + 100};

  // background: ${p => p.theme.textBlack};
  width: calc(100% - ${p => Number(p.theme.workbenchWidth)}px);
  min-height: 64px;
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

@observer
class TrainerBar extends React.Component<TrainerBarProps> {
  // constructor(props: TrainerBarProps) {
  //   super(props);
  // }
  render() {
    const { terria, theme, viewState } = this.props;
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
        onClick={() => this.props.viewState.setTopElement("TrainerBar")}
      >
        {/* Psuedo background */}
        <Box
          css={`
            background: black;
            opacity: 0.85;
            z-index: 0;
          `}
          positionAbsolute
          fullWidth
          fullHeight
        />
        <Box fullWidth fullHeight centered justifySpaceBetween>
          {/* Trainer Items */}
          <Box>
            <Spacing right={6} />
            <Select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                viewState.setCurrentTrainerItemIndex(Number(e.target.value))
              }
              value={viewState.currentTrainerItemIndex}
              css={"min-width: 280px;"}
            >
              {selectedTrainerItems.map((item, index) => (
                <option value={index}>{item.title}</option>
              ))}
            </Select>
            <Spacing right={8} />
          </Box>

          {/* Trainer Steps within a Trainer Item */}
          <Box fullWidth left>
            <Select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                viewState.setCurrentTrainerStepIndex(Number(e.target.value))
              }
              value={viewState.currentTrainerStepIndex}
              css={"min-width: 280px;"}
            >
              {selectedTrainerSteps.map((item, index) => (
                <option value={index}>{item}</option>
              ))}
            </Select>
            <Spacing right={8} />
          </Box>

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
              onClick={() =>
                viewState.setCurrentTrainerStepIndex(
                  viewState.currentTrainerStepIndex - 1
                )
              }
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
              onClick={() =>
                viewState.setCurrentTrainerStepIndex(
                  viewState.currentTrainerStepIndex + 1
                )
              }
            >
              Next
            </Button>
            <Spacing right={5} />
            <Box centered>
              <CloseButton
                noAbsolute
                // topRight
                color={this.props.theme.textLight}
                onClick={() => viewState.setTrainerBarVisible(false)}
              />
            </Box>
            <Spacing right={6} />
          </Box>
        </Box>
      </TrainerBarWrapper>
    );
  }
}

export default withTranslation()(withTheme(TrainerBar));
