import React, { FC } from "react";
import Clipboard from "../../../../../Clipboard";
import { ShareUrlInput } from "../input/ShareUrlInput";
import Terria from "../../../../../../Models/Terria";
import {
  Category,
  ShareAction
} from "../../../../../../Core/AnalyticEvents/analyticEvents";

interface IShareUrlClipboardProps {
  terria: Terria;
  theme: "dark" | "light";
  inputTheme?: "dark" | "light";
  rounded: boolean;
  shareUrl: string;
  placeholder?: string;
}

export const ShareUrlClipboard: FC<IShareUrlClipboardProps> = ({
  terria,
  theme = "light",
  inputTheme,
  rounded,
  shareUrl,
  placeholder
}) => {
  return (
    <Clipboard
      theme={theme}
      text={shareUrl}
      source={
        <ShareUrlInput
          theme={inputTheme}
          shareUrl={shareUrl}
          placeholder={placeholder}
          css={`
            ${rounded ? `border-radius:  32px 0 0 32px;` : ""}
          `}
        />
      }
      id="share-url"
      rounded={rounded}
      onCopy={text =>
        terria.analytics?.logEvent(Category.share, ShareAction.storyCopy, text)
      }
    />
  );
};
