import classNames from "classnames";
import { TFunction } from "i18next";
import { observer } from "mobx-react";
import { action, makeObservable, observable } from "mobx";
import styled from "styled-components";
import React, { ChangeEventHandler } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import createElevationBandMaterial from "terriajs-cesium/Source/Scene/createElevationBandMaterial";
import Color from "terriajs-cesium/Source/Core/Color";
import Styles from "./color-panel.scss";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Button from "../../../../Styled/Button";
import Input from "../../../../Styled/Input";
import Icon, { StyledIcon } from "../../../../Styled/Icon";
import { TextSpan } from "../../../../Styled/Text";

const MenuPanel =
  require("../../../StandardUserInterface/customizable/MenuPanel").default;

interface PropTypes extends WithTranslation {
  terria: Terria;
  modalWidth: number;
  viewState: ViewState;
  onUserClick: () => void;
  t: TFunction;
}

interface ColorPanelState {
  isOpen: boolean;
}

interface IColorLayer {
  fromHeight: number;
  fromColor: string;
  toHeight: number;
  toColor: string;
}

@observer
class ColorPanel extends React.Component<PropTypes, ColorPanelState> {
  static displayName = "ColorPanel";

  @observable private bandTransparency: number = 0.5;
  @observable private layers: IColorLayer[] = [];

  constructor(props: PropTypes) {
    super(props);
    makeObservable(this);
    this.changeOpenState = this.changeOpenState.bind(this);

    this.state = {
      isOpen: false
    };
  }

  changeOpenState(open: boolean) {
    this.setState({
      isOpen: open
    });
  }

  apply() {
    const scene = this.props.terria.cesium?.scene;
    if (scene) {
      const material = createElevationBandMaterial({
        scene: scene,
        layers: this.layers.map((layer) => {
          return {
            entries: [
              {
                height: layer.fromHeight,
                color: Color.fromCssColorString(layer.fromColor).withAlpha(
                  this.bandTransparency
                )
              },
              {
                height: layer.toHeight,
                color: Color.fromCssColorString(layer.toColor).withAlpha(
                  this.bandTransparency
                )
              }
            ]
          };
        })
      });
      scene.globe.material = material;
    }
  }

  @action
  addLayer() {
    this.layers.push({
      fromHeight: 0,
      fromColor: "#0000FF",
      toHeight: 0,
      toColor: "#0000FF"
    });
  }

  @action
  removeLayer(index: number) {
    this.layers.splice(index, 1);
  }

  render() {
    const { t } = this.props;
    const { modalWidth } = this.props;
    const dropdownTheme = {
      inner: classNames(Styles.dropdownInner)
    };

    return (
      <MenuPanel
        theme={dropdownTheme}
        btnText={t("colorPanel.header")}
        viewState={this.props.viewState}
        btnTitle={t("colorPanel.headerTitle")}
        isOpen={this.state.isOpen}
        onOpenChanged={this.changeOpenState}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <>
          <Box>
            <TextSpan medium>{t("colorPanel.title")}</TextSpan>
          </Box>
          <Box>
            <Explanation>{t("colorPanel.explanation")}</Explanation>
          </Box>
          <Box
            styledMargin="10px 8px 8px 0"
            style={{ display: "flex", alignItems: "center" }}
          >
            {t("colorPanel.transparency")}
            <Input
              style={{ marginLeft: "8px" }}
              styledWidth="100px"
              min={0}
              max={1}
              step={0.01}
              dark
              type="number"
              value={this.bandTransparency}
              onChange={action((e) => {
                this.bandTransparency = parseFloat(e.target.value);
              })}
            />
          </Box>
          <ColorPanelButton
            title={t("colorPanel.addButtonTitle")}
            onClick={() => {
              this.addLayer();
            }}
          >
            <StyledIcon
              light
              realDark
              glyph={Icon.GLYPHS.add}
              styledWidth="24px"
            />
          </ColorPanelButton>
          {this.layers.map((layer, index) => {
            return (
              <Box key={index}>
                <Box>
                  <InputElevation
                    placeholder={t("colorPanel.fromPlaceholder")}
                    value={layer.fromHeight}
                    changeFunc={action((e) => {
                      layer.fromHeight = Number(e.target.value);
                      this.layers.splice(index, 1, layer);
                    })}
                  />
                  <InputColor
                    value={layer.fromColor}
                    changeFunc={action((e) => {
                      layer.fromColor = String(e.target.value);
                      layer.toColor = String(e.target.value);
                      this.layers.splice(index, 1, layer);
                    })}
                  />
                  <InputElevation
                    placeholder={t("colorPanel.toPlaceholder")}
                    value={layer.toHeight}
                    changeFunc={action((e) => {
                      layer.toHeight = Number(e.target.value);
                      this.layers.splice(index, 1, layer);
                    })}
                  />
                  <InputColor
                    value={layer.toColor}
                    changeFunc={action((e) => {
                      layer.toColor = String(e.target.value);
                      this.layers.splice(index, 1, layer);
                    })}
                  />
                  <ColorPanelButton
                    title={t("colorPanel.removeButtonTitle")}
                    onClick={() => {
                      this.removeLayer(index);
                    }}
                  >
                    <StyledIcon
                      light
                      realDark
                      glyph={Icon.GLYPHS.remove}
                      styledWidth="24px"
                    />
                  </ColorPanelButton>
                </Box>
              </Box>
            );
          })}
          <Box>
            <ColorPanelButton
              primary
              onClick={() => {
                this.apply();
              }}
            >
              {t("colorPanel.applyButton")}
            </ColorPanelButton>
          </Box>
          <Box>
            <Explanation>{t("colorPanel.warning")}</Explanation>
          </Box>
        </>
      </MenuPanel>
    );
  }
}

const Explanation = styled(TextSpan)`
  opacity: 0.8;
  font-size: smaller;
  font-weight: lighter;
  font-style: italic;
`;

const ColorPanelButton = styled(Button)`
  border-radius: 4px;
  margin: 2px;
`;

interface InputElevationProps {
  placeholder: string;
  value: number;
  changeFunc: ChangeEventHandler<HTMLInputElement>;
}

const InputElevation = (props: InputElevationProps) => {
  return (
    <Input
      style={{ margin: 2 }}
      dark
      large
      type="number"
      placeholder={props.placeholder}
      value={props.value}
      onChange={props.changeFunc}
    />
  );
};

interface InputColorProps {
  value: string;
  changeFunc: ChangeEventHandler<HTMLInputElement>;
}

const InputColor = (props: InputColorProps) => {
  return (
    <Input
      style={{ margin: 2 }}
      dark
      large
      type="color"
      value={props.value}
      onChange={props.changeFunc}
    />
  );
};

export default withTranslation()(ColorPanel);
