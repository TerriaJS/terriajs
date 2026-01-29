import React, { useState, useEffect } from "react";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Styles from "./measurable-download.scss";
import i18next from "i18next";
import { useTheme } from "styled-components";
import { Button } from "../../Styled/Button";
import Select from "../../Styled/Select";
import Terria from "../../Models/Terria";
import Input from "../../Styled/Input";
import MeasurableDownload, {
  DownloadLink
} from "../../ViewModels/MeasurableGeometry/MeasurableGeometryDownload";
import ViewState from "../../ReactViewModels/ViewState";
import { observer } from "mobx-react";

interface Props {
  terria: Terria;
  viewState: ViewState;
  pathNotes: string;
  ellipsoid: Ellipsoid;
  defaultFilename?: string;
}

const MeasurableDownloadContent = observer((props: Props) => {
  const { terria, viewState, pathNotes, ellipsoid, defaultFilename } = props;
  const [name, setName] = useState<string>("");
  const [selectedElementIndex, setSelectedElementIndex] = useState<number>(
    terria.measurableGeometryIndex
  );
  const [isSelectAll, setIsSelectAll] = useState<boolean>(
    terria.measurableGeomList.length > 1
  );
  const geom = isSelectAll
    ? terria.measurableGeomList[terria.measurableGeometryIndex]
    : terria.measurableGeomList[selectedElementIndex];

  const theme = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [measurableDownload, setMeasurableDownload] =
    useState<MeasurableDownload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (ellipsoid) {
      const download = new MeasurableDownload(terria);
      setMeasurableDownload(download);
    }
  }, [ellipsoid, terria]);

  useEffect(() => {
    if (viewState.measurableDownloadPanelIsVisible) {
      setName(
        MeasurableDownload.normalizeDefaultFilename(defaultFilename ?? "")
      );
      setSelectedFormat("");
      setSelectedElementIndex(terria.measurableGeometryIndex);
      setIsSelectAll(terria.measurableGeomList.length > 1);
    }
  }, [
    terria.measurableGeometryIndex,
    viewState.measurableDownloadPanelIsVisible,
    terria.measurableGeomList.length,
    defaultFilename
  ]);

  useEffect(() => {
    const loadData = async () => {
      if (geom && measurableDownload) {
        try {
          setIsLoading(true);
          const isMultiPath = isSelectAll;
          const geomListForMultiPath = isSelectAll
            ? terria.measurableGeomList
            : undefined;

          const allLinks = await measurableDownload.generateAllFormatLinks(
            geom,
            name,
            isMultiPath,
            ellipsoid,
            geomListForMultiPath
          );

          setDownloadLinks(allLinks);
        } catch (error) {
          console.error("Error loading download data:", error);
          setDownloadLinks([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [
    name,
    geom,
    selectedElementIndex,
    isSelectAll,
    pathNotes,
    ellipsoid,
    measurableDownload,
    terria.measurableGeomList,
    viewState.measurableDownloadPanelIsVisible
  ]);

  const handleDownload = () => {
    if (measurableDownload) {
      const success = measurableDownload.handleDownload(
        downloadLinks,
        selectedFormat
      );
      if (!success) {
        console.error("Failed to download file");
      }
    }
  };

  const isDownloadDisabled =
    !measurableDownload ||
    !measurableDownload.isValidForDownload(name, selectedFormat, isLoading);

  const handleElementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "all") {
      setIsSelectAll(true);
      setSelectedElementIndex(terria.measurableGeometryIndex);
    } else {
      setIsSelectAll(false);
      setSelectedElementIndex(parseInt(value, 10));
    }

    setSelectedFormat("");
    e.target.blur();
  };

  return (
    <>
      {terria.measurableGeomList.length > 1 && (
        <div style={{ marginBottom: "10px" }}>
          <Select
            title={i18next.t("measurableGeometry.changePath")}
            value={isSelectAll ? "all" : selectedElementIndex.toString()}
            onChange={handleElementChange}
            onBlur={(e: React.ChangeEvent<HTMLSelectElement>) =>
              e.target.blur()
            }
            disabled={isLoading}
          >
            <option value="all">{i18next.t("downloadData.selectAll")}</option>
            {terria.measurableGeomList.map((geom, index) => {
              const hasValidPoints =
                geom.stopPoints && geom.stopPoints.length > 0;
              return (
                <option
                  key={index}
                  value={index.toString()}
                  disabled={!hasValidPoints}
                >
                  {`${i18next.t("measurableGeometry.elementPlaceholder")} ${
                    index + 1
                  }`}
                </option>
              );
            })}
          </Select>
        </div>
      )}

      <div style={{ marginBottom: "5px" }}>
        <Input
          dark
          type="text"
          title={i18next.t("downloadData.filenamePlaceholderTitle")}
          placeholder={i18next.t("downloadData.filenamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <Select
          title={i18next.t("downloadData.formatPlaceholder")}
          css={`
            padding-top: 5px;
          `}
          value={selectedFormat}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedFormat(e.target.value);
            e.target.blur();
          }}
          onBlur={(e: React.ChangeEvent<HTMLSelectElement>) => e.target.blur()}
          className={Styles.dropdownList}
          disabled={isLoading || !name}
        >
          {downloadLinks.map((link) => (
            <option key={link.key} value={link.key}>
              {link.label}
            </option>
          ))}
        </Select>
        <Button
          title={i18next.t("downloadData.downloadButtonTitle")}
          css={`
            color: ${theme.textLight};
            background: ${theme.colorPrimary};
            margin-left: 10px;
          `}
          onClick={handleDownload}
          disabled={isDownloadDisabled}
        >
          {isLoading
            ? i18next.t("loader.loadingMessage")
            : i18next.t("Download")}
        </Button>
      </div>
    </>
  );
});

export default MeasurableDownloadContent;
