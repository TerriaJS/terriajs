import { reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import isDefined from "../../Core/isDefined";
import AnnotationCatalogItem from "../../Models/Catalog/CatalogItems/AnnotationCatalogItem";
import GlobeOrMap, { ScreenAnchor } from "../../Models/GlobeOrMap";
import ViewState from "../../ReactViewModels/ViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";

interface AnnotationPopupsProps {
  viewState: ViewState;
}

interface PopupEntry {
  key: string;
  item: AnnotationCatalogItem;
  id: string;
  text: string;
  cartesian: Cartesian3;
}

/** Returns all annotation items currently shown on the workbench. */
function annotationItems(viewState: ViewState): AnnotationCatalogItem[] {
  return viewState.terria.workbench.items.filter(
    (model): model is AnnotationCatalogItem =>
      model instanceof AnnotationCatalogItem
  );
}

/** Finds the annotation item that owns the given annotation id, if any. */
function findOwner(
  viewState: ViewState,
  id: string
): AnnotationCatalogItem | undefined {
  return annotationItems(viewState).find((item) =>
    isDefined(item.getAnnotation(id))
  );
}

/** Builds the list of currently-open annotation popups. */
function openPopups(viewState: ViewState): PopupEntry[] {
  const entries: PopupEntry[] = [];
  for (const item of annotationItems(viewState)) {
    if (!item.show) continue;
    for (const annotation of item.annotations) {
      if (
        annotation.open &&
        isDefined(annotation.id) &&
        isDefined(annotation.longitude) &&
        isDefined(annotation.latitude)
      ) {
        entries.push({
          key: `${item.uniqueId}:${annotation.id}`,
          item,
          id: annotation.id,
          text: annotation.text ?? "",
          cartesian: Cartesian3.fromDegrees(
            annotation.longitude,
            annotation.latitude,
            annotation.height ?? 0
          )
        });
      }
    }
  }
  return entries;
}

/**
 * Renders a floating, world-anchored popup for each open annotation. Positioning is
 * delegated to the active viewer via {@link GlobeOrMap.addScreenAnchor} so popups
 * track their marker natively in both Leaflet (2D) and Cesium (3D) - including
 * through the Leaflet zoom animation - and stay a fixed screen size. Multiple can be
 * open at once.
 */
const AnnotationPopups = observer(function AnnotationPopups({
  viewState
}: AnnotationPopupsProps) {
  const terria = viewState.terria;
  const viewer = terria.currentViewer; // observed: re-key inner on viewer switch
  const entries = openPopups(viewState);

  // Clicking an annotation marker (when the annotation tool is inactive) toggles its
  // popup rather than opening the docked feature info panel.
  useEffect(() => {
    const disposer = reaction(
      () => terria.selectedFeature,
      (feature) => {
        if (!isDefined(feature) || !isDefined(feature.id)) return;
        const id = String(feature.id);
        const owner = findOwner(viewState, id);
        if (owner) {
          runInAction(() => {
            owner.toggleAnnotationOpen(id);
            terria.selectedFeature = undefined;
            terria.pickedFeatures = undefined;
          });
        }
      }
    );
    return disposer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remount the anchor layer when the viewer changes so anchors are recreated on the
  // new viewer (Leaflet marker vs Cesium DOM element).
  return (
    <AnchorLayer
      key={viewer.type}
      viewer={viewer}
      entries={entries}
      viewState={viewState}
    />
  );
});

interface AnchorLayerProps {
  viewer: GlobeOrMap;
  entries: PopupEntry[];
  viewState: ViewState;
}

const AnchorLayer: FC<AnchorLayerProps> = ({ viewer, entries, viewState }) => {
  const anchorsRef = useRef<Map<string, ScreenAnchor>>(new Map());
  const [, setTick] = useState(0);
  const forceRender = () => setTick((t) => t + 1);

  // Reconcile anchors against the open entries (runs each render; only creates or
  // destroys on actual changes).
  useLayoutEffect(() => {
    const anchors = anchorsRef.current;
    const keys = new Set(entries.map((e) => e.key));
    let changed = false;
    for (const entry of entries) {
      if (!anchors.has(entry.key)) {
        anchors.set(entry.key, viewer.addScreenAnchor(entry.cartesian));
        changed = true;
      }
    }
    for (const [key, anchor] of anchors) {
      if (!keys.has(key)) {
        safeDestroy(anchor);
        anchors.delete(key);
        changed = true;
      }
    }
    if (changed) forceRender();
  });

  // Destroy all anchors when the viewer changes (this component is remounted) or on
  // unmount.
  useEffect(() => {
    const anchors = anchorsRef.current;
    return () => {
      anchors.forEach(safeDestroy);
      anchors.clear();
    };
  }, []);

  return (
    <>
      {entries.map((entry) => {
        const anchor = anchorsRef.current.get(entry.key);
        return anchor
          ? createPortal(
              <Popup entry={entry} viewState={viewState} />,
              anchor.element,
              entry.key
            )
          : null;
      })}
    </>
  );
};

function safeDestroy(anchor: ScreenAnchor) {
  try {
    anchor.destroy();
  } catch {
    // The viewer may already be torn down; ignore.
  }
}

const Popup: FC<{ entry: PopupEntry; viewState: ViewState }> = ({
  entry,
  viewState
}) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CloseButton
        type="button"
        title={t(($) => $.annotations.popup.close)}
        onClick={() => entry.item.setAnnotationOpen(entry.id, false)}
      >
        {"×"}
      </CloseButton>
      <Body>{parseCustomHtmlToReact(entry.text)}</Body>
      <Footer>
        <TextButton
          type="button"
          onClick={() =>
            viewState.openAnnotationEditor({
              initialText: entry.item.getAnnotation(entry.id)?.text ?? "",
              isNew: false,
              onSave: (text: string) =>
                entry.item.updateAnnotation(entry.id, { text }),
              onDelete: () => entry.item.removeAnnotation(entry.id)
            })
          }
        >
          {t(($) => $.annotations.popup.edit)}
        </TextButton>
        <TextButton
          type="button"
          onClick={() => entry.item.removeAnnotation(entry.id)}
        >
          {t(($) => $.annotations.popup.delete)}
        </TextButton>
      </Footer>
    </Card>
  );
};

// Positioned so its bottom points at the anchor, centred horizontally.
const Card = styled.div`
  pointer-events: auto;
  position: absolute;
  transform: translate(-50%, calc(-100% - 14px));
  min-width: 160px;
  max-width: 280px;
  max-height: 260px;
  overflow: auto;
  padding: 10px 12px;
  background: ${(p) => p.theme.dark};
  color: ${(p) => p.theme.textLight};
  border-radius: ${(p) => p.theme.radiusLarge};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  font-size: 14px;
  line-height: 1.4;

  a {
    color: ${(p) => p.theme.colorPrimary};
  }
`;

const Body = styled.div`
  word-break: break-word;

  p {
    margin: 0 0 0.5em;
  }
`;

const Footer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const TextButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
  color: ${(p) => p.theme.textLightTranslucent ?? p.theme.textLight};

  &:hover {
    color: ${(p) => p.theme.textLight};
    text-decoration: underline;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 4px;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: ${(p) => p.theme.textLight};
`;

export default AnnotationPopups;
