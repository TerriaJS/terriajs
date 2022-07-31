import React, { FC, useState } from "react";

import { observer } from "mobx-react";
import { Trans, useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

import { BaseModel } from "../../../../Models/Definition/Model";
import ViewState from "../../../../ReactViewModels/ViewState";

import Box from "../../../../Styled/Box";
import Text from "../../../../Styled/Text";

import { DataCatalog } from "../../../DataCatalog";
import DataPreview from "../../../Preview/DataPreview";
import { AddDataButtons, AddDataSection } from "./AddData";
import { EmptyMyDataTab } from "./EmptyMyDataTab";
import { PromptBox } from "./PromptBox";

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
            previewed={viewState.userDataPreviewedItem}
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
