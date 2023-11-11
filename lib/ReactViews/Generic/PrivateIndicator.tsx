import React from "react";
import { useTranslation } from "react-i18next";

import Icon from "../../Styled/Icon";
import { BoxSpan } from "../../Styled/Box";

export const PrivateIndicator: React.FC = (props) => {
  const { t } = useTranslation();

  return (
    <BoxSpan centered title={t("catalogItem.privateIndicatorTitle")}>
      <Icon
        glyph={Icon.GLYPHS.lock}
        css={`
          width: 15px;
          height: 15px;
          fill: currentColor;
        `}
        {...props}
      />
    </BoxSpan>
  );
};
