import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import OpacityTraits from "../../../Traits/TraitsClasses/OpacityTraits";
import Box from "../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import { useViewState } from "../../Context";

/**
 * Slider for controlling the opacity of the current base map, shown in the
 * map settings panel. Renders nothing if the base map doesn't support
 * opacity, opts out of the control via `disableOpacityControl`, or the
 * `disableBaseMapOpacityControl` config parameter is set.
 */
const BaseMapOpacitySlider: FC = observer(() => {
  const { t } = useTranslation();
  const viewState = useViewState();
  const { terria } = viewState;
  const baseMap = terria.mainViewer.baseMap;

  if (
    terria.configParameters.disableBaseMapOpacityControl ||
    !hasTraits(baseMap, OpacityTraits, "opacity") ||
    (hasTraits(baseMap, OpacityTraits, "disableOpacityControl") &&
      baseMap.disableOpacityControl)
  ) {
    return null;
  }

  const changeOpacity = (value: number) => {
    runInAction(() => {
      baseMap.setTrait(CommonStrata.user, "opacity", value / 100.0);
    });
  };

  return (
    <>
      <Spacing bottom={2} />
      <Box column>
        <Box paddedVertically={1}>
          <Text as="label">{t(($) => $.settingPanel.baseMapOpacity)}</Text>
        </Box>
        <Box verticalCenter>
          <Slider
            min={0}
            max={100}
            value={(baseMap.opacity * 100) | 0}
            onChange={changeOpacity}
            css={`
              margin: 0 10px;
              margin-top: 5px;
            `}
          />
        </Box>
      </Box>
    </>
  );
});

export default BaseMapOpacitySlider;
