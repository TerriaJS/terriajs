import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { DragEvent, FC, MouseEvent, useRef, useState } from "react";
import { Trans } from "react-i18next";
import styled, { useTheme } from "styled-components";
import {
  Category,
  DataSourceAction
} from "../Core/AnalyticEvents/analyticEvents";
import isDefined from "../Core/isDefined";
import Result from "../Core/Result";
import CatalogMemberMixin, { getName } from "../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../ModelMixins/MappableMixin";
import addUserFiles from "../Models/Catalog/addUserFiles";
import { BaseModel } from "../Models/Definition/Model";
import Box from "../Styled/Box";
import Icon, { StyledIcon } from "../Styled/Icon";
import Text from "../Styled/Text";
import { raiseFileDragDropEvent } from "../ViewModels/FileDragDropListener";
import { useViewState } from "./Context";
import DragDropNotification from "./DragDropNotification";

const DropZone = styled.div<{ isActive: boolean }>`
  position: absolute;
  background: transparent;
  opacity: 0;
  z-index: -1;
  transition: height 0.25s ease-in-out;

  ${({ isActive, theme }) =>
    isActive &&
    `
    position: fixed;
    top: 0;
    left: 0;

    width: 100vw;
    height: 100vh;
    z-index: 99999;

    transition: opacity, 0.2s;

    opacity: 1;
    display: block;
    border: 0;

    background: radial-gradient(
      ellipse at center,
      ${theme.transparentDark} 0%,
      ${theme.dark} 100%
    );
  `}
`;

const DragDropFile: FC = observer(() => {
  const viewState = useViewState();
  const theme = useTheme();
  const targetRef = useRef<EventTarget>();
  const [lastUploadedFiles, setLastUploadedFiles] = useState<readonly string[]>(
    []
  );

  const handleDrop = async (e: DragEvent) => {
    e.persist();
    e.preventDefault();
    e.stopPropagation();

    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      // Log event to analytics for each file dropped (sometimes multiple files dropped in one DragEvent)
      const fileType =
        e.dataTransfer.files[i].type ||
        e.dataTransfer.files[i].name.split(".").pop(); // use file extension if type property is empty

      viewState.terria.analytics?.logEvent(
        Category.dataSource,
        DataSourceAction.addFromDragAndDrop,
        `File Type: ${fileType}, File Size(B): ${e.dataTransfer.files[i].size}`
      );
    }

    try {
      const addedCatalogItems: BaseModel[] | undefined = await addUserFiles(
        e.dataTransfer.files,
        viewState.terria,
        viewState
      );

      if (isDefined(addedCatalogItems) && addedCatalogItems.length > 0) {
        runInAction(() => (viewState.myDataIsUploadView = false));
        if (viewState.explorerPanelIsVisible) {
          (
            await viewState.viewCatalogMember(addedCatalogItems[0])
          ).throwIfError(`Failed to view ${getName(addedCatalogItems[0])}`);
          viewState.openUserData();
        } else {
          // update last batch of uploaded files
          setLastUploadedFiles(
            addedCatalogItems.map(
              (item) =>
                (CatalogMemberMixin.isMixedInto(item)
                  ? item.name
                  : item.uniqueId) as string
            )
          );
        }

        // Add load all mapable items
        const mappableItems = addedCatalogItems.filter(
          MappableMixin.isMixedInto
        );

        Result.combine(
          await Promise.all(mappableItems.map((f) => f.loadMapItems())),
          "Failed to load uploaded files"
        ).raiseError(viewState.terria);

        raiseFileDragDropEvent({
          addedItems: mappableItems,
          mouseCoordinates: { clientX: e.clientX, clientY: e.clientY }
        });

        // Zoom to first item
        const firstZoomableItem = mappableItems.find(
          (i) => isDefined(i.rectangle) && i.disableZoomTo === false
        );

        if (isDefined(firstZoomableItem)) {
          runInAction(() =>
            viewState.terria.currentViewer.zoomTo(firstZoomableItem, 1)
          );
        }
      }

      runInAction(() => (viewState.isDraggingDroppingFile = false));
    } catch (e) {
      viewState.terria.raiseErrorToUser(e, "Failed to upload files");
    }
  };

  const handleDragEnter = action((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    targetRef.current = e.target;
  });

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = action((e: MouseEvent) => {
    e.preventDefault();
    if (e.screenX === 0 && e.screenY === 0) {
      viewState.isDraggingDroppingFile = false;
    }
    if (e.target === document || e.target === targetRef.current) {
      viewState.isDraggingDroppingFile = false;
    }
  });

  const handleMouseLeave = action(() => {
    viewState.isDraggingDroppingFile = false;
  });

  return (
    <>
      <DropZone
        isActive={viewState.isDraggingDroppingFile}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseLeave={handleMouseLeave}
      >
        {viewState.isDraggingDroppingFile ? (
          <Box centered fullWidth fullHeight column>
            <StyledIcon glyph={Icon.GLYPHS.dragDrop} styledHeight="80px" />
            <Trans i18nKey="dragDrop.text">
              <Text
                textLight
                textAlignCenter
                pop
                as="h3"
                css={`
                  margin-top: ${theme.spacing}px;
                  font-weight: 700;
                `}
              >
                Drag & Drop
              </Text>
              <Text textLight pop textAlignCenter styledFontSize="24px">
                Your data anywhere to view on the map
              </Text>
            </Trans>
          </Box>
        ) : null}
      </DropZone>
      <DragDropNotification uploadedFiles={lastUploadedFiles} />
    </>
  );
});
DragDropFile.displayName = "DragDropFile";

export default DragDropFile;
