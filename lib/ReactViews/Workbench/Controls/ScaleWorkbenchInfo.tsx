import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import { applyTranslationIfExists } from "../../../Language/languageHelpers";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import { BaseModel } from "../../../Models/Definition/Model";
import { Spacing } from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";

interface IScaleWorkbenchInfoProps {
  item: BaseModel;
}
export const ScaleWorkbenchInfo = observer(function ScaleWorkbenchInfo({
  item
}: IScaleWorkbenchInfoProps) {
  const { i18n } = useTranslation();
  if (!MinMaxLevelMixin.isMixedInto(item) || !item.scaleWorkbenchInfo) {
    return null;
  }
  return (
    <>
      <Spacing bottom={2} />
      <Text>{applyTranslationIfExists(item.scaleWorkbenchInfo, i18n)}</Text>
    </>
  );
});
