import { observer } from "mobx-react";
import { FC, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components";
import Box from "../Styled/Box";
import { RawButton } from "../Styled/Button";
import Icon, { StyledIcon } from "../Styled/Icon";
import Text, { TextSpan } from "../Styled/Text";
import { useViewState } from "./Context";

interface DragDropNotificationProps {
  uploadedFiles: readonly string[];
}

const DragDropNotification: FC<DragDropNotificationProps> = observer(
  ({ uploadedFiles }) => {
    const theme = useTheme();
    const viewState = useViewState();
    const [showNotification, setShowNotification] = useState(false);
    const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

    useEffect(() => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      // show notification, restart timer
      setShowNotification(true);
      // initialise new time out
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
      };
    }, [uploadedFiles]);

    const handleHover = () => {
      // reset timer on hover
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
      }, 4000);
    };

    const handleClick = () => {
      viewState.openUserData();
    };

    const fileNames = uploadedFiles.join(",");

    return (
      <RawButton
        css={`
          display: flex;
          background: #ffffff;
          position: fixed;
          right: -280px;
          top: 80px;
          z-index: 9;
          transition: all 0.25s;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          ${showNotification && fileNames.length > 0 && `right: 100px;`};
        `}
        onMouseEnter={handleHover}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <Box
          paddedRatio={3}
          css={`
            background: ${theme.colorPrimary};
          `}
        >
          <StyledIcon
            glyph={Icon.GLYPHS.upload}
            light
            styledWidth="35px"
            opacity={0.9}
          />
        </Box>
        <Box
          paddedRatio={3}
          displayInlineBlock
          styledWidth="210px"
          css={`
            color: ${theme.dark};
          `}
        >
          <Text extraLarge breakWord>
            <Trans i18nKey="dragDrop.notification" count={uploadedFiles.length}>
              <TextSpan bold noFontSize>
                {/** @ts-expect-error i18next won't properly interpolate text if not in double brackets({{ }}) */}
                &quot;{{ fileNames }}&quot;
              </TextSpan>
              {{ count: uploadedFiles.length }} been added to{" "}
              <TextSpan primary noFontSize>
                My data
              </TextSpan>
            </Trans>
          </Text>
        </Box>
      </RawButton>
    );
  }
);

DragDropNotification.displayName = "DragDropNotification";

export default DragDropNotification;
