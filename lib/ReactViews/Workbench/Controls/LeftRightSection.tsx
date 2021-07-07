import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import CommonStrata from "../../../Models/CommonStrata";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Spacing from "../../../Styled/Spacing";

interface ILeftRightButton {
  isActive: boolean;
}

const LeftRightButton = styled(RawButton).attrs({ fullWidth: true })<
  ILeftRightButton
>`
  text-align: center;
  padding: 5px;
  color: ${p => p.theme.textLight};
  background-color: ${p => p.theme.dark};
  ${p =>
    p.isActive &&
    `
    background-color: ${p.theme.colorSplitter};
  `}
  &:hover,
  &:focus {
    background-color: ${p => p.theme.colorSplitter};
  }
`;

interface ILeftRightSection {
  item: any;
}

const LeftRightSection: React.FC<ILeftRightSection> = observer(
  ({ item }: ILeftRightSection) => {
    const goLeft = () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.LEFT
        );
      });
    };

    const goBoth = () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.NONE
        );
      });
    };

    const goRight = () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          ImagerySplitDirection.RIGHT
        );
      });
    };

    const { t } = useTranslation();
    const splitDirection = item.splitDirection;

    if (
      !item.supportsSplitting ||
      !defined(splitDirection) ||
      !item.terria.showSplitter
    ) {
      return null;
    }

    return (
      <>
        <Spacing bottom={3} />
        <Box>
          <LeftRightButton
            type="button"
            onClick={goLeft}
            title={t("splitterTool.workbench.goleftTitle")}
            isActive={splitDirection === ImagerySplitDirection.LEFT}
          >
            {t("splitterTool.workbench.goleft")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={goBoth}
            title={t("splitterTool.workbench.bothTitle")}
            isActive={splitDirection === ImagerySplitDirection.NONE}
          >
            {t("splitterTool.workbench.both")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={goRight}
            title={t("splitterTool.workbench.gorightTitle")}
            isActive={splitDirection === ImagerySplitDirection.RIGHT}
          >
            {t("splitterTool.workbench.goright")}
          </LeftRightButton>
        </Box>
      </>
    );
  }
);

LeftRightSection.displayName = "LeftRightSection";

export default LeftRightSection;
