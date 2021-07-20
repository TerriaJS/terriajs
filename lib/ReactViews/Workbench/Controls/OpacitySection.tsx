"use strict";

import { TFunction } from "i18next";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import CommonStrata from "../../../Models/CommonStrata";
import hasTraits from "../../../Models/hasTraits";
import Box from "../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import RasterLayerTraits from "../../../Traits/TraitsClasses/RasterLayerTraits";

interface IProps extends WithTranslation {
  item: any;
  t: TFunction;
}

@observer
class OpacitySection extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    this.changeOpacity = this.changeOpacity.bind(this);
  }
  changeOpacity(value: number) {
    const item = this.props.item;
    if (hasTraits(item, RasterLayerTraits, "opacity")) {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "opacity", value / 100.0);
      });
    }
  }

  render() {
    const item = this.props.item;
    const { t } = this.props;
    if (
      !hasTraits(item, RasterLayerTraits, "opacity") ||
      (item as any).disableOpacityControl
    ) {
      return null;
    }
    return (
      <>
        <Spacing bottom={3} />
        <Box verticalCenter>
          <StyledLabel small>
            {t("workbench.opacity", {
              opacity: Math.round(item.opacity * 100)
            })}
          </StyledLabel>
          <Spacing right={3} />
          <Slider
            min={0}
            max={100}
            value={(item.opacity * 100) | 0}
            onChange={this.changeOpacity}
          />
        </Box>
      </>
    );
  }
}

const StyledLabel = styled(Text).attrs({ as: "label" })`
  white-space: nowrap;
  flex-basis: 50%;
`;

export default withTranslation()(OpacitySection);
