"use strict";

import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import OpacityTrait from "../../../Traits/OpacityTrait";
import Styles from "./opacity-section.scss";

interface OpacitySectionProps extends WithTranslation {
  item: CatalogMemberMixin.Instance;
}

@observer
class OpacitySection extends React.Component<OpacitySectionProps> {
  changeOpacity(value: number) {
    const item = this.props.item;
    if (hasTraits(item, OpacityTrait, "opacity")) {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "opacity", value / 100.0);
      });
    }
  }

  render() {
    const item = this.props.item;
    const { t } = this.props;
    if (
      !hasTraits(item, OpacityTrait, "opacity") ||
      (hasTraits(item, OpacityTrait, "disableOpacityControl") &&
        item.disableOpacityControl)
    ) {
      return null;
    }
    return (
      <div className={Styles.opacity}>
        <label htmlFor="opacity">
          {t("workbench.opacity", {
            opacity: item.opacity * 100
          })}
        </label>
        <Slider
          className={Styles.opacitySlider}
          min={0}
          max={100}
          value={(item.opacity * 100) | 0}
          onChange={val => this.changeOpacity(val)}
        />
      </div>
    );
  }
}

export default withTranslation()(OpacitySection);
