import React from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "./../../../Styled/Checkbox/Checkbox";
import { useTheme } from "styled-components";
import Spacing from "../../../Styled/Spacing";

interface IDisplayAsPercentSection {
  item: any;
}

const DisplayAsPercentSection: React.FC<IDisplayAsPercentSection> = (
  props: IDisplayAsPercentSection
) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const togglePercentage = () => {
    props.item.displayPercent = !props.item.displayPercent;
  };

  if (!props.item.canDisplayPercent) {
    return null;
  }

  return (
    <>
      <Spacing bottom={2} />
      <Checkbox
        id="workbenchDisplayPercent"
        isChecked={props.item.displayPercent}
        label={t("workbench.displayPercent") as any}
        onChange={togglePercentage}
      />
    </>
  );
};
DisplayAsPercentSection.displayName = "DisplayAsPercentSection";

export default DisplayAsPercentSection;
