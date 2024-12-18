import { FC, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "../Styled/Box";
import Button from "../Styled/Button";
import Icon, { StyledIcon } from "../Styled/Icon";
import { verticalAlign } from "../Styled/mixins";
import Spacing from "../Styled/Spacing";

enum CopyStatus {
  Success,
  Error,
  Default
}

interface ClipboardProps {
  source: ReactNode;
  theme: "dark" | "light";
  rounded?: boolean;
  text?: string;
  onCopy?: (contents: string) => void;
}

const Clipboard: FC<ClipboardProps> = (props) => {
  const { source, theme, rounded, text, onCopy } = props;
  const { t } = useTranslation();
  const [status, setStatus] = useState<CopyStatus>(CopyStatus.Default);

  const handleCopy = async () => {
    try {
      if (text) {
        await navigator.clipboard.writeText(text);
        setStatus(CopyStatus.Success);
        if (onCopy) onCopy(text);
      } else {
        setStatus(CopyStatus.Error);
      }
    } catch {
      setStatus(CopyStatus.Error);
    }
  };

  useEffect(() => {
    if (status === CopyStatus.Success || status === CopyStatus.Error) {
      const timer = setTimeout(() => {
        setStatus(CopyStatus.Default);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const isLightTheme = theme === "light";
  const canCopy = !!navigator.clipboard;

  return (
    <ClipboardDiv>
      <Box>
        {source}
        {canCopy && (
          <Button
            onClick={handleCopy}
            primary
            css={`
              width: 80px;
              border-radius: 2px;
              ${rounded && `border-radius:  0 32px 32px 0;`}
            `}
            textProps={{ large: true }}
          >
            {t("clipboard.copy")}
          </Button>
        )}
      </Box>
      {canCopy && status !== CopyStatus.Default && (
        <>
          <Spacing bottom={2} />
          <Box
            css={`
              line-height: 10px;
            `}
          >
            <StyledIcon
              light={!isLightTheme}
              realDark={isLightTheme}
              glyph={
                status === CopyStatus.Success
                  ? Icon.GLYPHS.selected
                  : Icon.GLYPHS.close
              }
              styledWidth="20px"
              css={`
                margin: 8px;
                margin-left: 0;
                display: inline-block;
              `}
            />
            <TooltipText>
              {status === CopyStatus.Success
                ? t("clipboard.success")
                : t("clipboard.unsuccessful")}
            </TooltipText>
          </Box>
        </>
      )}
    </ClipboardDiv>
  );
};

export default Clipboard;

const ClipboardDiv = styled.div`
  position: relative;
`;

const TooltipText = styled.span`
  ${verticalAlign("absolute")}
  left: 30px;
`;
