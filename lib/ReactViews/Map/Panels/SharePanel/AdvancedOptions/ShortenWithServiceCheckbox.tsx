import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import Checkbox from "../../../../../Styled/Checkbox";
import { TextSpan } from "../../../../../Styled/Text";

interface IShortenWithServiceCheckboxProps {
  canShorten: boolean;
  shouldShorten: boolean;
  onChange: () => void;
}

export const ShortenWithServiceCheckbox: FC<IShortenWithServiceCheckboxProps> = ({
  canShorten,
  shouldShorten,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <Checkbox
      textProps={{ medium: true }}
      id="shortenUrl"
      isChecked={shouldShorten}
      onChange={onChange}
      isDisabled={!canShorten}
    >
      <TextSpan>{t("share.shortenUsingService")}</TextSpan>
    </Checkbox>
  );
};
