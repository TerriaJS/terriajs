import React, { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "styled-components";

import Box from "../../../../Styled/Box";
import { RawButton } from "../../../../Styled/Button";
import { StyledIcon, GLYPHS } from "../../../../Styled/Icon";
import Spacing from "../../../../Styled/Spacing";
import { TextSpan } from "../../../../Styled/Text";

import { ITab } from "./MyDataTab";

export const AddDataButtons: FC<{ changeTab: (tabId: string) => void }> = ({
  changeTab
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const tabs: ITab[] = useMemo(
    () => [
      {
        id: "local",
        caption: t("addData.localTitle")
      },
      {
        id: "web",
        caption: t("addData.webTitle")
      }
    ],
    []
  );

  return (
    <Box paddedRatio={2} gap={3}>
      {tabs.map(tab => (
        <RawButton
          onClick={() => changeTab(tab.id)}
          title={tab.caption}
          key={tab.id}
          css={`
            display: flex;
            align-items: center;
            color: ${theme.colorPrimary};
            &:hover,
            &:focus {
              color: ${theme.grey};
            }
          `}
        >
          <StyledIcon glyph={GLYPHS[tab.id]} styledHeight="15px" />
          <Spacing right={1} />
          <TextSpan medium>{tab.caption}</TextSpan>
        </RawButton>
      ))}
    </Box>
  );
};
