import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import styled from "styled-components";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import Cesium from "../../Models/Cesium";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Checkbox from "../../Styled/Checkbox";
import Icon from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";

enum Side {
  Left = "Left",
  Both = "Both",
  Right = "Right"
}

const sideValues = Object.keys(Side) as Side[];

type PropsType = {
  terria: Terria;
};

// mangled from SettingPanel.jsx
@observer
class WorkbenchSplitScreen extends React.Component<PropsType> {
  render() {
    const props = this.props;
    const terria = props.terria;

    const showTerrainOnSide = (side: Side) => {
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

    const toggleDepthTestAgainstTerrainEnabled = () => {
      runInAction(() => {
        this.props.terria.depthTestAgainstTerrainEnabled = !this.props.terria
          .depthTestAgainstTerrainEnabled;
      });
      terria.currentViewer.notifyRepaintRequired();
    };

    const isCesiumWithTerrain =
      terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      terria.mainViewer.viewerOptions.useTerrain &&
      terria.currentViewer instanceof Cesium &&
      terria.currentViewer.scene &&
      terria.currentViewer.scene.globe;
    const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;

    const supportsSide = isCesiumWithTerrain;
    let currentSide = "Both";
    if (supportsSide) {
      switch (terria.terrainSplitDirection) {
        case ImagerySplitDirection.LEFT:
          currentSide = "Left";
          break;
        case ImagerySplitDirection.RIGHT:
          currentSide = "Right";
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

    const depthTestAgainstTerrainLabel = `Press to start ${
      depthTestAgainstTerrainEnabled ? "showing" : "hiding"
    } features that are underneath the terrain surface`;
    // const { t } = useTranslation();
    if (!supportsSide) {
      return null;
    }
    return (
      <Panel>
        <PanelTitle>
          <Box>SPLIT SCREEN MODE</Box>
          <RawButton
            onClick={() => {
              runInAction(() => (terria.showSplitter = !terria.showSplitter));
            }}
          >
            <Icon glyph={Icon.GLYPHS.close} />
          </RawButton>
        </PanelTitle>
        <PanelBody>
          <Spacing bottom={1} />
          <Box>
            <Text
              medium
              css={`
                padding-bottom: 6px;
              `}
            >
              Terrain position
            </Text>
          </Box>
          <Box>
            <SidesList>
              {sideValues.map(side => (
                <li key={side}>
                  <SideButton
                    isActive={side === currentSide}
                    onClick={() => showTerrainOnSide(side)}
                  >
                    {side}
                  </SideButton>
                </li>
              ))}
            </SidesList>
          </Box>
          {supportsDepthTestAgainstTerrain && (
            <>
              <Spacing bottom={2} />
              <Checkbox
                isChecked={depthTestAgainstTerrainEnabled}
                onChange={() => toggleDepthTestAgainstTerrainEnabled()}
                title={depthTestAgainstTerrainLabel}
              >
                Terrain hides underground features
              </Checkbox>
            </>
          )}
          <Spacing bottom={1} />
        </PanelBody>
      </Panel>
    );
  }
}

const Panel = styled(Box).attrs({ fullWidth: true, column: true })`
  background: ${p => p.theme.darkWithOverlay};
  color: ${p => p.theme.textLight};
  svg {
    fill: ${p => p.theme.textLight};
    width: 14px;
    height: 14px;
  }
  margin: 5px 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
`;

const PanelTitle = styled(Box).attrs({
  fullWidth: true,
  centered: true,
  justifySpaceBetween: true
})`
  background: ${p => p.theme.colorSecondary};
  padding: 0 10px;
  font-weight: bold;
  font-size: 14px;
  color: ${p => p.theme.textLight};
  letter-spacing: 0;
  line-height: 34px;
`;

const PanelBody = styled(Box).attrs({ column: true })`
  background: ${p => p.theme.darkWithOverlay};
  padding: 5px 10px;
`;

const SidesList = styled.ul`
  display: flex;
  width: 100%;
  margin: 0;
  list-style: none;
  padding-left: 0;
  margin: 0;
  li {
    padding: 0;
    flex: 1;
  }
`;

const SideButton = styled.button<{ isActive: boolean }>`
  width: 100%;
  height: 30px;
  border: none !important;

  font-size: 0.85rem;
  font-weight: 400;
  line-height: 20px;
  text-align: center;

  color: ${p => p.theme.textLight};
  background-color: ${p => p.theme.dark};
  ${p =>
    p.isActive &&
    `
    background-color: ${p.theme.colorSecondary};
  `}
  &:hover,
  &:focus {
    background-color: ${p => p.theme.colorSecondary};
  }
`;

export default WorkbenchSplitScreen;
