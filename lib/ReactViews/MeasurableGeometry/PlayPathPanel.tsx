import { Rnd } from "react-rnd";
import Terria from "../../Models/Terria";
import Styles from "./measurable-panel.scss";
import Icon, { StyledIcon } from "../../Styled/Icon";
import i18next from "i18next";
import ViewState from "../../ReactViewModels/ViewState";
import classNames from "classnames";
import React from "react";
import Button from "../../Styled/Button";
import { useTheme } from "styled-components";
import Slider from "rc-slider";
import usePlayPath from "../Custom/PlayPath";
import { runInAction } from "mobx";
import { observer } from "mobx-react";

interface Props {
  terria: Terria;
  viewState: ViewState;
  onClose?: () => void;
}

const PlayPathPanel = observer((props: Props) => {
  const theme = useTheme();
  const {
    playSpeed,
    setPlaySpeed,
    playingPath,
    isCameraMoving,
    countdown,
    currentPointIndex,
    onPlay,
    onPause,
    onStop
  } = usePlayPath(props.terria, props.viewState);

  const panelClassName = classNames(Styles.panel, {
    [Styles.isVisible]: props.viewState.playPathPanelIsVisible,
    [Styles.isTranslucent]: props.viewState.explorerPanelIsVisible
  });

  const renderHeader = () => {
    return (
      <div className={Styles.header}>
        <span
          style={{
            justifyContent: "center",
            display: "flex"
          }}
        >
          <b>{i18next.t("playPath.title")}</b>
        </span>
        <button
          type="button"
          onClick={() => {
            props.onClose?.();
            runInAction(() => {
              props.viewState.playPathPanelIsVisible = false;
            });
          }}
          className={Styles.btnCloseFeature}
          title={i18next.t("general.close")}
        >
          <Icon glyph={Icon.GLYPHS.close} />
        </button>
      </div>
    );
  };

  const renderBody = () => {
    return (
      <div
        className={Styles.body}
        style={{
          padding: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 8,
            width: "100%",
            maxWidth: "100px"
          }}
        >
          <Button
            onClick={playingPath ? onPause : onPlay}
            disabled={!playingPath && isCameraMoving}
            css={`
              color: ${theme.textLight};
              background: ${theme.colorPrimary};
              min-width: 80px;
            `}
            title={
              playingPath
                ? i18next.t("playPath.tooltip.pause")
                : i18next.t("playPath.tooltip.play")
            }
          >
            <StyledIcon
              glyph={playingPath ? Icon.GLYPHS.pause : Icon.GLYPHS.play}
              styledWidth="16px"
            />
          </Button>
          {(playingPath || currentPointIndex !== 0) && (
            <Button
              onClick={onStop}
              title={i18next.t("playPath.tooltip.stop")}
              css={`
                color: ${theme.textLight};
                background: ${theme.colorPrimary};
                min-width: 80px;
              `}
            >
              <StyledIcon glyph={Icon.GLYPHS.refresh} styledWidth="16px" />
            </Button>
          )}
        </div>
        <div
          className="no-drag"
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: "130%",
            gap: 8
          }}
        >
          <label style={{ whiteSpace: "nowrap", fontSize: "0.9em" }}>
            {i18next.t("playPath.speed")}:
          </label>
          <Slider
            min={0.5}
            max={3}
            step={0.1}
            value={playSpeed}
            disabled={playingPath}
            onChange={(val) => {
              setPlaySpeed(val);
            }}
            aria-valuetext={`${i18next.t(
              "playPath.tooltip.speedSlider"
            )}: ${playSpeed}x`}
            css={`
              flex: 1;
              width: 100%;
            `}
          />
          <span style={{ minWidth: 32, textAlign: "right", fontSize: "0.9em" }}>
            {playSpeed}x
          </span>
        </div>
      </div>
    );
  };

  return (
    <Rnd
      bounds="window"
      default={{
        x: 50,
        y: 50,
        width: window.innerWidth * 0.1,
        height: "auto"
      }}
      maxWidth={window.innerWidth * 0.4}
      enableResizing={{ right: false, left: false }}
      cancel=".no-drag"
    >
      <div
        className={panelClassName}
        style={{ pointerEvents: "auto" }}
        aria-hidden={!props.viewState.playPathPanelIsVisible}
      >
        {renderHeader()}
        {countdown !== null ? (
          <div
            className={Styles.body}
            style={{
              padding: 20,
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              fontSize: "3em"
            }}
          >
            <b>{countdown}</b>
          </div>
        ) : (
          renderBody()
        )}
      </div>
    </Rnd>
  );
});

export default PlayPathPanel;
