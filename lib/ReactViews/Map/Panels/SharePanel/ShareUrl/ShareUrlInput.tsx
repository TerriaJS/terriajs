import React, { FC } from "react";

import Input from "../../../../../Styled/Input";
import { useTranslation } from "react-i18next";

interface IStoryShareInput {
  theme?: "light" | "dark";
  shareUrl: string;
  placeholder?: string;
}

export const ShareUrlInput: FC<IStoryShareInput> = ({
  theme = "light",
  shareUrl,
  placeholder,
  ...args
}) => {
  const { t } = useTranslation();

  return (
    <Input
      light={theme === "light"}
      dark={theme === "dark"}
      large
      type="text"
      value={shareUrl}
      placeholder={placeholder ?? t("share.shortLinkShortening")}
      readOnly
      onClick={e => e.currentTarget.select()}
      id="share-url"
      {...args}
    />
  );
};
