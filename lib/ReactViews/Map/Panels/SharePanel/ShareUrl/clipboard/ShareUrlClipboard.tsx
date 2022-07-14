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
  shareUrl: string;
  placeholder?: string;
}

export const ShareUrlClipboard: FC<IShareUrlClipboardProps> = ({
  terria,
  theme = "light",
  inputTheme,
  shareUrl,
  placeholder,
  ...args
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
          {...args}
        />
      }
      id="share-url"
      rounded
      onCopy={text =>
        terria.analytics?.logEvent(Category.share, ShareAction.storyCopy, text)
      }
    />
  );
};
