import React, { FC, useState, useMemo } from "react";
import { observer } from "mobx-react";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import { useTranslation, Trans } from "react-i18next";
import Box from "../../../../Styled/Box";
import { AddDataSection } from "./AddData/AddDataSection";
import { DataCatalog } from "../../../DataCatalog/DataCatalog";
import Text, { TextSpan } from "../../../../Styled/Text";
import { RawButton } from "../../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../../Styled/Icon";
import styled, { useTheme } from "styled-components";
import Spacing from "../../../../Styled/Spacing";
import { AddDataButtons } from "./AddDataButtons";
import { EmptyMyDataTab } from "./EmptyMyDataTab";
import DataPreview from "../../../Preview/DataPreview";
import { PromptBox } from "./PromptBox";
import { BaseModel } from "../../../../Models/Definition/Model";

interface IMyDataTabProps {
  viewState: ViewState;
  // used by external components to customise the list of available types
  localDataTypes?: any[];
  remoteDataTypes?: any[];
  onFileAddFinished: (item: BaseModel[]) => void;
}

export interface ITab {
  id: "local" | "web";
  caption: string;
}

export const MyDataTab: FC<IMyDataTabProps> = observer(
  ({ viewState, localDataTypes, remoteDataTypes, onFileAddFinished }) => {
    const [activeTabId, setActiveTabId] = useState<string>();
    const theme = useTheme();

    const { t } = useTranslation();

    const { terria } = viewState;

    const changeTab = (tabId: string) => {
      setActiveTabId(tabId);
    };

    const resetTab = () => {
      setActiveTabId(undefined);
    };

    if (activeTabId) {
      return (
        <AddDataSection
          viewState={viewState}
          activeTabId={activeTabId}
          goBack={resetTab}
          localDataTypes={localDataTypes}
          remoteDataTypes={remoteDataTypes}
          onFileAddFinished={onFileAddFinished}
        />
      );
    }

    if (
      !activeTabId &&
      terria.catalog.userAddedDataGroup.members.length === 0
    ) {
      return <EmptyMyDataTab changeTab={changeTab} />;
    }

    return (
      <Box fullWidth>
        <Box
          flexShrinkZero
          column
          styledWidth="40%"
          css={{ borderRight: `1px solid ${theme.greyLighter}` }}
          overflowY="auto"
          scroll
        >
          <Box paddedHorizontally={2} paddedVertically={2}>
            <Text>
              <Trans i18nKey="addData.note">
                <strong>Note: </strong>Data added in this way is not saved or
                made visible to others.
              </Trans>
            </Text>
          </Box>
          <StyledBox>
            <AddDataButtons changeTab={changeTab} />
          </StyledBox>

          <Box
            paddedHorizontally={1}
            css={`
              border-bottom: 1px solid ${theme.greyLighter};
            `}
            fullWidth
          >
            <DataCatalog
              items={terria.catalog.userAddedDataGroup.memberModels}
              removable={true}
              viewState={viewState}
              terria={terria}
            />
          </Box>
          <Box paddedRatio={2} styledMinHeight={"200px"} fullHeight>
            <PromptBox backgroundColor={theme.modalSecondaryBg}>
              <Box pt={2}>
                <Text textDark>{t("addData.dragDrop")}</Text>
              </Box>
            </PromptBox>
          </Box>
        </Box>
        <Box styledWidth="60%">
          <DataPreview
            terria={terria}
            viewState={viewState}
            previewed={viewState.previewedItem}
          />
        </Box>
      </Box>
    );
  }
);

const StyledBox = styled(Box)`
  border-top: 1px solid ${props => props.theme.greyLighter};
  border-bottom: 1px solid ${props => props.theme.greyLighter};
`;
