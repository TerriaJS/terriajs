import React from "react";
import { useTranslation } from "react-i18next";
import { getName } from "../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../ModelMixins/MappableMixin";
import Feature from "../../Models/Feature";
import ViewState from "../../ReactViewModels/ViewState";
import Styles from "./feature-info-catalog-item.scss";
import FeatureInfoSection from "./FeatureInfoSection";

interface Props {
  features: Feature[];
  catalogItem: MappableMixin.Instance;
  viewState: ViewState;
  onToggleOpen: (f: Feature) => void;
  printView?: boolean;
}

export default (props: Props) => {
  const { t } = useTranslation();
  const features = props.features;
  const catalogItem = props.catalogItem;
  const terria = props.viewState.terria;

  const maximumShownFeatureInfos =
    catalogItem.maximumShownFeatureInfos ??
    terria.configParameters.defaultMaximumShownFeatureInfos;

  const hiddenNumber = features.length - maximumShownFeatureInfos; // A positive hiddenNumber => some are hidden; negative means none are.

  return (
    <li>
      <ul className={Styles.sections}>
        {hiddenNumber === 1 ? (
          <li className={Styles.messageItem}>
            <strong>
              {t("featureInfo.catalogItem.moreThanMax", {
                maximum: maximumShownFeatureInfos,
                catalogItemName: getName(catalogItem)
              })}
            </strong>
            <br />
            {t("featureInfo.catalogItem.featureInfoShown", {
              maximum: maximumShownFeatureInfos
            })}
          </li>
        ) : null}

        {hiddenNumber > 1 ? (
          <li className={Styles.messageItem}>
            <strong>
              {t("featureInfo.catalogItem.featuresFound", {
                featCount: features.length,
                catalogItemName: getName(catalogItem)
              })}
            </strong>
            <br />
            {t("featureInfo.catalogItem.featureInfoShown", {
              maximum: maximumShownFeatureInfos
            })}
          </li>
        ) : null}

        {features.slice(0, maximumShownFeatureInfos).map((feature, i) => {
          return (
            <FeatureInfoSection
              key={i}
              viewState={props.viewState}
              catalogItem={catalogItem}
              feature={feature}
              position={terria.pickedFeatures?.pickPosition}
              template={catalogItem.featureInfoTemplate}
              isOpen={!!(feature === terria.selectedFeature || props.printView)}
              onClickHeader={props.onToggleOpen}
              printView={props.printView}
            />
          );
        })}
      </ul>
    </li>
  );
};
