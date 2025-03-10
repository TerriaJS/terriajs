import { reaction } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { RawButton } from "../Styled/Button";
import Icon, { StyledIcon } from "../Styled/Icon";
import { useViewState } from "./Context";
import { useTheme } from "styled-components";
import Box from "../Styled/Box";
import Text, { TextSpan } from "../Styled/Text";

const DragDropNotification: FC = observer(() => {
  const theme = useTheme();
  const viewState = useViewState();
  const [showNotification, setShowNotification] = useState(false);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const disposer = reaction(
      () => viewState.lastUploadedFiles,
      () => {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        // show notification, restart timer
        setShowNotification(true);
        // initialise new time out
        notificationTimeoutRef.current = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    );

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      disposer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fileNames = viewState.lastUploadedFiles.join(",");

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
          <Trans
            i18nKey="dragDrop.notification"
            count={viewState.lastUploadedFiles.length}
          >
            <TextSpan bold noFontSize>
              &quot;{{ fileNames }}&quot;
            </TextSpan>
            {{ count: viewState.lastUploadedFiles.length }} been added to{" "}
            <TextSpan primary noFontSize>
              My data
            </TextSpan>
          </Trans>
        </Text>
      </Box>
    </RawButton>
  );
});

DragDropNotification.displayName = "DragDropNotification";

export default DragDropNotification;
