import { Rnd } from "react-rnd";
import { runInAction } from "mobx";
import MeasurableDownload from "./MeasurableDownload";
import Terria from "../../Models/Terria";
import Styles from "./measurable-panel.scss";
import Icon from "../../Styled/Icon";
import i18next from "i18next";
import ViewState from "../../ReactViewModels/ViewState";
import classNames from "classnames";

interface Props {
  terria: Terria;
  viewState: ViewState;
  initialWidth?: number;
  maxWidth?: number;
  onClose?: () => void;
}

const MeasurableDownloadPanel = (props: Props) => {
  const { onClose, ...downloadProps } = props;
  const isMobile = downloadProps.viewState.useSmallScreenInterface;

  const panelClassName = classNames(Styles.panel, {
    [Styles.isCollapsed]: downloadProps.viewState.measurablePanelIsCollapsed,
    [Styles.isVisible]:
      downloadProps.viewState.measurableDownloadPanelIsVisible,
    [Styles.isTranslucent]: downloadProps.viewState.explorerPanelIsVisible
  });

  const renderHeader = () => {
    return (
      <div className={Styles.header}>
        <div>
          <span style={{ display: "flex", justifyContent: "center" }}>
            <b>DOWNLOAD</b>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            runInAction(() => {
              downloadProps.viewState.measurableDownloadPanelIsVisible = false;
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

  const panelContent = (
    <div
      className={panelClassName}
      style={{
        pointerEvents: "auto"
      }}
    >
      {renderHeader()}
      <div className={Styles.body} style={{ padding: "20px" }}>
        <MeasurableDownload
          terria={downloadProps.terria}
          pathNotes={
            downloadProps.terria.measurableGeomList[
              downloadProps.terria.measurableGeometryIndex
            ].pathNotes ?? ""
          }
          ellipsoid={downloadProps.terria?.cesium?.scene?.globe?.ellipsoid!!}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          touchAction: "auto",
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
        }}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <Rnd
      bounds="window"
      default={{
        x: 50,
        y: 50,
        width: downloadProps.initialWidth ?? window.innerWidth * 0.2,
        height: "auto"
      }}
      maxWidth={downloadProps.maxWidth ?? window.innerWidth * 0.6}
      enableResizing={{
        right: true,
        left: true
      }}
    >
      {panelContent}
    </Rnd>
  );
};

export default MeasurableDownloadPanel;
