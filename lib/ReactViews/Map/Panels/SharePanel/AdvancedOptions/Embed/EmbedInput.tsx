import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import Input from "../../../../../../Styled/Input";

interface IEmbedInputProps {
  shareUrl?: string;
}

export const EmbedInput: FC<IEmbedInputProps> = ({ shareUrl }) => {
  const { t } = useTranslation();

  const iframeCode =
    shareUrl && shareUrl.length > 0
      ? `<iframe style="width: 720px; height: 600px; border: none;" src="${shareUrl}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
      : "";

  return (
    <Input
      large
      dark
      type="text"
      readOnly
      placeholder={t("share.shortLinkShortening")}
      value={iframeCode}
      onClick={e => {
        const target = e.target as HTMLInputElement;
        return target.select();
      }}
    />
  );
};
