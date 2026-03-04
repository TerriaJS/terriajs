import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import Box from "../Styled/Box";
import Button from "../Styled/Button";
import Icon, { StyledIcon } from "../Styled/Icon";
import Input from "../Styled/Input";
import { verticalAlign } from "../Styled/mixins";
import Spacing from "../Styled/Spacing";

enum CopyStatus {
  Success,
  Error,
  Default
}

interface ClipboardProps {
  text?: string;
  inputTheme?: "light" | "dark";
  inputPlaceholder?: string;
  // needed for testing
  timeout?: number;
  onCopy?: (contents: string) => void;
  createdMessage?: string;
}

const Clipboard: FC<ClipboardProps> = (props) => {
  const { text, inputTheme, inputPlaceholder, onCopy, createdMessage } = props;
  const { t } = useTranslation();
  const styledTheme = useTheme();
  const [status, setStatus] = useState<CopyStatus>(CopyStatus.Default);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const prevTextRef = useRef(text);

  useEffect(() => {
    if (createdMessage && !prevTextRef.current && text) {
      setShowCreatedMessage(true);
    }
    prevTextRef.current = text;
  }, [text, createdMessage]);

  const handleCopy = async () => {
    setShowCreatedMessage(false);
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
      }, props.timeout ?? 3000);

      return () => clearTimeout(timer);
    }
  }, [status, props.timeout]);

  const canCopy = !!navigator.clipboard;

  const statusMessage =
    status === CopyStatus.Error
      ? t("clipboard.unsuccessful")
      : status === CopyStatus.Success
      ? t("clipboard.success")
      : createdMessage;

  return (
    <ClipboardDiv>
      <Box>
        <Input
          light={inputTheme === "light"}
          dark={inputTheme === "dark"}
          large
          type="text"
          value={text}
          placeholder={inputPlaceholder ?? t("share.shortLinkShortening")}
          readOnly
          onClick={(e) => e.currentTarget.select()}
        />
        {canCopy && (
          <Button
            onClick={handleCopy}
            primary
            css={`
              width: 80px;
              border-radius: 0 2px 2px 0;
            `}
            textProps={{ large: true }}
          >
            {t("clipboard.copy")}
          </Button>
        )}
      </Box>
      {(canCopy && status !== CopyStatus.Default) || showCreatedMessage ? (
        <>
          <Spacing bottom={2} />
          <Box
            css={`
              line-height: 10px;
            `}
          >
            <StyledIcon
              light
              glyph={
                status === CopyStatus.Error
                  ? Icon.GLYPHS.close
                  : Icon.GLYPHS.selected
              }
              styledWidth="20px"
              css={`
                margin: 8px;
                margin-left: 0;
                display: inline-block;
                ${status !== CopyStatus.Error &&
                `fill: ${styledTheme.textSuccess};`}
              `}
            />
            <TooltipText
              css={`
                ${status !== CopyStatus.Error &&
                `color: ${styledTheme.textSuccess};`}
              `}
            >
              {statusMessage}
            </TooltipText>
          </Box>
        </>
      ) : null}
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
