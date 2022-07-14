import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import Checkbox from "../../../../../Styled/Checkbox";
import { TextSpan } from "../../../../../Styled/Text";

interface IIncludeStoryCheckboxProps {
  includeStory: boolean;
  onChange: () => void;
}

export const IncludeStoryCheckbox: FC<IIncludeStoryCheckboxProps> = ({
  includeStory,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <Checkbox
      textProps={{ medium: true }}
      id="includeStory"
      title="Include Story in Share"
      isChecked={includeStory}
      onChange={onChange}
    >
      <TextSpan>{t("includeStory.message")}</TextSpan>
    </Checkbox>
  );
};
