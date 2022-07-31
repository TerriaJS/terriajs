import React, { FC } from "react";
import { Trans } from "react-i18next";

import { useTheme } from "styled-components";

import Box from "../../../../Styled/Box";
import Text from "../../../../Styled/Text";

import { AddDataButtons } from "./AddData";
import { MyDataTabContainer } from "./MyDataTabContainer";
import { PromptBox } from "./PromptBox";

export const EmptyMyDataTab: FC<{ changeTab: (tabId: string) => void }> = ({
  changeTab
}) => {
  const theme = useTheme();

  return (
    <MyDataTabContainer>
      <Trans i18nKey="addData.infoText">
        <Text textDark extraLarge styledLineHeight="2">
          Drag and drop a file here to view it locally on the map
        </Text>
        <Text textDark extraLarge styledLineHeight="2">
          (it won’t be saved or uploaded to the internet)
        </Text>
      </Trans>
      <Box paddedRatio={2}>
        <AddDataButtons changeTab={changeTab} />
      </Box>
      <PromptBox />
    </MyDataTabContainer>
  );
};
