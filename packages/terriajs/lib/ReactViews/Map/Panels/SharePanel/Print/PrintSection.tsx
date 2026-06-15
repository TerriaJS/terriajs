import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import styled from "styled-components";

import ViewState from "../../../../../ReactViewModels/ViewState";

import Box from "../../../../../Styled/Box";
import { TextSpan } from "../../../../../Styled/Text";
import Button from "../../../../../Styled/Button";
import { downloadImg } from "./PrintView";
import Spacing from "../../../../../Styled/Spacing";

interface IPrintSectionProps {
  viewState: ViewState;
}

export const PrintSection: FC<IPrintSectionProps> = ({ viewState }) => {
  const { t } = useTranslation();

  const [isDownloading, setIsDownloading] = useState(false);

  const printView = () => {
    const newWindow = window.open();
    viewState.setPrintWindow(newWindow);
  };

  const downloadMap = () => {
    setIsDownloading(true);
    viewState.terria.currentViewer
      .captureScreenshot()
      .then((dataString) => {
        downloadImg(dataString);
      })
      .finally(() => setIsDownloading(false));
  };

  return (
    <Box column>
      <TextSpan semiBold medium>
        {t("share.printTitle")}
      </TextSpan>
      <Spacing bottom={1} />
      <Explanation>{t("share.printExplanation")}</Explanation>
      <Spacing bottom={1} />
      <Box gap={2}>
        <PrintButton
          primary
          fullWidth
          disabled={isDownloading}
          onClick={downloadMap}
        >
          <TextSpan medium>{t("share.downloadMap")}</TextSpan>
        </PrintButton>
        <PrintButton primary fullWidth onClick={printView}>
          <TextSpan medium>{t("share.printViewButton")}</TextSpan>
        </PrintButton>
      </Box>
    </Box>
  );
};

const PrintButton = styled(Button)`
  border-radius: 4px;
`;

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
