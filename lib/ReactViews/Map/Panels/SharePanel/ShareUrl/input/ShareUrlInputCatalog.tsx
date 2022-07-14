import React, { FC } from "react";

import { ShareUrlInput } from "./ShareUrlInput";

interface IShareUrlInputCatalogProps {
  shareUrl: string;
}

export const ShareUrlInputCatalog: FC<IShareUrlInputCatalogProps> = ({
  shareUrl
}) => {
  return <ShareUrlInput shareUrl={shareUrl} theme="dark" />;
};
