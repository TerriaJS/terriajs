// import React, { useState } from "react";
import React from "react";
import PropTypes from "prop-types";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { withTranslation } from "react-i18next";
// import styled from "styled-components";

import classNames from "classnames";

import Icon from "../Icon";

import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";

import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import ViewerMode from "../../Models/ViewerMode";

import DropdownStyles from "../Map/Panels/panel.scss";
import Styles from "../Map/Panels/setting-panel.scss";

// mangled from SettingPanel.jsx
@observer
class WorkbenchSplitScreen extends React.Component {
  render() {
    const props = this.props;
    const terria = props.terria;
    const { t } = props;
    const showTerrainOnSide = (side, event) => {
      event && event.stopPropagation();
      runInAction(() => {
        switch (side) {
          case "Left":
            terria.terrainSplitDirection = ImagerySplitDirection.LEFT;
            terria.showSplitter = true;
            break;
          case "Right":
            terria.terrainSplitDirection = ImagerySplitDirection.RIGHT;
            terria.showSplitter = true;
            break;
          case "Both":
            terria.terrainSplitDirection = ImagerySplitDirection.NONE;
            break;
        }

        terria.currentViewer.notifyRepaintRequired();
      });
    };

    const toggleDepthTestAgainstTerrainEnabled = event => {
      event && event.stopPropagation();
      runInAction(() => {
        this.props.terria.depthTestAgainstTerrainEnabled = !this.props.terria
          .depthTestAgainstTerrainEnabled;
      });
      terria.currentViewer.notifyRepaintRequired();
    };

    const isCesiumWithTerrain =
      terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      terria.mainViewer.viewerOptions.useTerrain &&
      terria.currentViewer &&
      terria.currentViewer.scene &&
      terria.currentViewer.scene.globe;
    const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;

    const supportsSide = isCesiumWithTerrain;
    const sides = ["Left", "Both", "Right"]; // eslint-disable-line i18next/no-literal-string
    let currentSide = "Both"; // eslint-disable-line i18next/no-literal-string
    if (supportsSide) {
      switch (terria.terrainSplitDirection) {
        case ImagerySplitDirection.LEFT:
          currentSide = "Left"; // eslint-disable-line i18next/no-literal-string
          break;
        case ImagerySplitDirection.RIGHT:
          currentSide = "Right"; // eslint-disable-line i18next/no-literal-string
          break;
      }
    }

    const depthTestAgainstTerrainEnabled =
      supportsDepthTestAgainstTerrain && terria.depthTestAgainstTerrainEnabled;

    // const depthTestAgainstTerrainFlag =
    //   terria.currentViewer &&
    //   terria.currentViewer.scene &&
    //   terria.currentViewer.scene.globe &&
    //   terria.currentViewer.scene.globe.depthTestAgainstTerrain;

    const depthTestAgainstTerrainLabel = t(
      "settingPanel.depthTestAgainstTerrainLabel",
      {
        showing: depthTestAgainstTerrainEnabled
          ? t("settingPanel.showing")
          : t("settingPanel.hiding")
      }
    );
    // const { t } = useTranslation();
    return (
      <If condition={supportsSide}>
        <Box
          fullWidth
          column
          css={`
            background: ${p => p.theme.darkWithOverlay};
            color: ${p => p.theme.textLight};
            svg {
              fill: ${p => p.theme.textLight};
              width: 14px;
              height: 14px;
            }
            margin: 5px 0;
            border: 1px solid rgba(255, 255, 255, 0.15);
          `}
        >
          <Box
            fullWidth
            centered
            justifySpaceBetween
            css={`
              background: ${p => p.theme.colorSplitter};
              padding: 0 10px;
              font-weight: bold;
              font-size: 14px;
              color: ${p => p.theme.textLight};
              letter-spacing: 0;
              line-height: 34px;
            `}
          >
            <Box>{t("workbench.splitScreenMode")}</Box>
            <RawButton
              onClick={() => {
                runInAction(() => (terria.showSplitter = !terria.showSplitter));
              }}
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </RawButton>
          </Box>
          <Box
            column
            css={`
              background: ${p => p.theme.darkWithOverlay};
              padding: 5px 10px;
            `}
          >
            <Spacing bottom={1} />
            <Box>
              <label className={DropdownStyles.heading}>
                {t("workbench.splitScreenMode")}
              </label>
              <Spacing bottom={1} />
            </Box>
            <Box>
              <ul
                className={Styles.viewerSelector}
                css={`
                  display: flex;
                  width: 100%;
                  margin: 0;
                  li {
                    padding: 0;
                  }
                `}
              >
                <For each="side" of={sides}>
                  <li
                    key={side}
                    css={`
                      flex: 1;
                    `}
                  >
                    <button
                      onClick={() => showTerrainOnSide(side)}
                      className={classNames(Styles.btnViewer, {
                        [Styles.isActive]: side === currentSide,
                        [Styles.isActiveSplitter]: side === currentSide
                      })}
                      css={`
                        &:not(select) {
                          border: none !important;
                          height: 30px;
                          font-size: 0.85rem;
                          font-weight: 400;
                          line-height: 20px;

                          &:hover,
                          &:focus {
                            background-color: ${p => p.theme.colorSplitter};
                          }
                        }
                      `}
                    >
                      {side}
                    </button>
                  </li>
                </For>
              </ul>
            </Box>
            <If condition={supportsDepthTestAgainstTerrain}>
              <>
                <Spacing bottom={2} />
                <Box className={Styles.nativeResolutionWrapper}>
                  <button
                    id="depthTestAgainstTerrain"
                    type="button"
                    onClick={() => toggleDepthTestAgainstTerrainEnabled()}
                    title={depthTestAgainstTerrainLabel}
                    className={Styles.btnNativeResolution}
                  >
                    {depthTestAgainstTerrainEnabled ? (
                      <Icon glyph={Icon.GLYPHS.checkboxOn} />
                    ) : (
                      <Icon glyph={Icon.GLYPHS.checkboxOff} />
                    )}
                  </button>
                  <label
                    title={depthTestAgainstTerrainLabel}
                    htmlFor="depthTestAgainstTerrain"
                    className={classNames(
                      DropdownStyles.subHeading,
                      Styles.nativeResolutionHeader
                    )}
                  >
                    {t("workbench.terrainHidesUnderground")}
                  </label>
                </Box>
              </>
            </If>
            <Spacing bottom={1} />
          </Box>
        </Box>
      </If>
    );
  }
}

WorkbenchSplitScreen.propTypes = {
  terria: PropTypes.object,
  t: PropTypes.func.isRequired
};

export default withTranslation()(WorkbenchSplitScreen);
