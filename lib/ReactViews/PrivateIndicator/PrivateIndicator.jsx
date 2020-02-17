import React from "react";
import { useTranslation } from "react-i18next";

import Icon from "../Icon.jsx";
import IconWrapper from "../../Styled/IconWrapper";

export default function PrivateIndicator() {
  const { t } = useTranslation();
  // if in catalog, show primary colour

  // if in workbench, show ..?
  return (
    <IconWrapper
      title={t("catalogItem.privateIndicatorTitle")}
      width={15}
      css={`
        svg {
          fill: ${p => p.theme.colorPrimary};
        }
      `}
    >
      <Icon glyph={Icon.GLYPHS.lock} />
    </IconWrapper>
  );
}
