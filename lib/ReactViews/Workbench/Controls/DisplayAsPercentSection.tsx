import { useTranslation } from "react-i18next";
import Spacing from "../../../Styled/Spacing";
import { TextSpan } from "../../../Styled/Text";
import Checkbox from "./../../../Styled/Checkbox/Checkbox";

interface IDisplayAsPercentSection {
  item: any;
}

function DisplayAsPercentSection(props: IDisplayAsPercentSection) {
  const { t } = useTranslation();
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
        onChange={togglePercentage}
      >
        <TextSpan>{t("workbench.displayPercent")}</TextSpan>
      </Checkbox>
    </>
  );
}
DisplayAsPercentSection.displayName = "DisplayAsPercentSection";

export default DisplayAsPercentSection;
