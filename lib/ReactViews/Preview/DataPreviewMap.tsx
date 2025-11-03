import classNames from "classnames";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import PreviewViewer from "../../ViewModels/PreviewViewer";
import Styles from "./data-preview-map.scss";

type PreviewedItem = MappableMixin.Instance & CatalogMemberMixin.Instance;

interface DataPreviewMapProps {
  terria: Terria;
  previewed?: PreviewedItem;
  showMap?: boolean;
}

const DataPreviewMap: FC<DataPreviewMapProps> = observer((props) => {
  const { t } = useTranslation();
  const { terria, previewed, showMap } = props;

  const mapContainerRef = useRef<HTMLDivElement>(null);

  const homeCamera = useMemo(() => {
    return terria.mainViewer.homeCamera;
  }, [terria]);

  const previewViewer = useMemo(() => {
    const viewer = new PreviewViewer(terria, previewed);

    runInAction(() => {
      viewer.viewerMode = ViewerMode.Leaflet;
      viewer.disableInteraction = true;
      viewer.homeCamera = homeCamera;
    });

    return viewer;
  }, [terria, previewed, homeCamera]);

  useEffect(() => {
    if (!showMap) {
      return;
    }

    const container = mapContainerRef.current;

    const baseMapItems = terria.baseMapsModel.baseMapItems;
    const initPreviewBaseMap = action(() =>
      baseMapItems.find(
        (bm) => bm.item.uniqueId === terria.baseMapsModel.previewBaseMapId
      )
    )();
    if (initPreviewBaseMap) {
      previewViewer.setBaseMap(initPreviewBaseMap.item);
    } else {
      previewViewer.setBaseMap(
        baseMapItems.length > 0 ? baseMapItems[0].item : undefined
      );
    }

    previewViewer.attach(container!);

    return () => {
      if (previewViewer.attached) {
        previewViewer.detach();
      }
    };
  }, [
    showMap,
    previewViewer,
    terria.baseMapsModel.baseMapItems,
    terria.baseMapsModel.previewBaseMapId
  ]);

  const toggleZoom = action(() => {
    if (previewViewer.isZoomedToExtent) {
      previewViewer.currentViewer.zoomTo(previewViewer?.homeCamera);
      previewViewer.isZoomedToExtent = false;
    } else {
      if (previewed) {
        previewViewer.currentViewer.zoomTo(previewed);
      }
      previewViewer.isZoomedToExtent = true;
    }
  });

  const previewBadgeState = useMemo(() => {
    if (previewed?.isLoading) return "loading";
    if (
      previewed?.loadMetadataResult?.error ||
      previewed?.loadMapItemsResult?.error
    )
      return "dataPreviewError";

    if (!previewed?.mapItems || previewed.mapItems.length === 0)
      return "noPreviewAvailable";
    return "dataPreview";
  }, [
    previewed?.isLoading,
    previewed?.loadMapItemsResult?.error,
    previewed?.loadMetadataResult?.error,
    previewed?.mapItems
  ]);

  const previewBadgeLabels: Record<string, string> = {
    loading: t("preview.loading"),
    noPreviewAvailable: t("preview.noPreviewAvailable"),
    dataPreview: t("preview.dataPreview"),
    dataPreviewError: t("preview.dataPreviewError")
  };

  return (
    <div className={Styles.map} onClick={toggleZoom}>
      {showMap ? (
        <div
          className={classNames(Styles.terriaPreview)}
          ref={mapContainerRef}
          key="terria-preview-map" // Ensures DOM is recreated if map needs clean state on show/hide
        />
      ) : (
        <div
          className={classNames(Styles.terriaPreview, Styles.placeholder)}
          key="terria-preview-placeholder"
        />
      )}
      <label className={Styles.badge}>
        {previewBadgeLabels[previewBadgeState] || ""}
      </label>
      {previewed?.previewCaption && (
        <div className={Styles.caption}>{previewed?.previewCaption}</div>
      )}
    </div>
  );
});

export default DataPreviewMap;
