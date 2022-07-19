import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import Input from "../../../../../Styled/Input";

import Clipboard from "../../../../Clipboard";
import Terria from "../../../../../Models/Terria";
import {
  Category,
  ShareAction
} from "../../../../../Core/AnalyticEvents/analyticEvents";

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
  const { t } = useTranslation();

  return (
    <Clipboard
      theme={theme}
      text={shareUrl}
      source={
        <Input
          light={inputTheme === "light"}
          dark={inputTheme === "dark"}
          large
          type="text"
          value={shareUrl}
          placeholder={placeholder ?? t("share.shortLinkShortening")}
          readOnly
          onClick={e => e.currentTarget.select()}
          css={`
            ${rounded ? `border-radius:  32px 0 0 32px;` : ""}
          `}
          id="share-url"
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
