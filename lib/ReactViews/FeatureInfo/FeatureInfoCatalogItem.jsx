import defined from 'terriajs-cesium/Source/Core/defined';
import FeatureInfoSection from './FeatureInfoSection';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import Styles from './feature-info-catalog-item.scss';

// Any Catalog in a feature-info-panel
const FeatureInfoCatalogItem = createReactClass({
    displayName: 'FeatureInfoCatalogItem',
    mixins: [ObserveModelMixin],

    propTypes: {
        features: PropTypes.array,
        catalogItem: PropTypes.object,
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        onToggleOpen: PropTypes.func.isRequired,
        printView: PropTypes.bool
    },

    render() {
        const features = this.props.features;
        const catalogItem = this.props.catalogItem;
        const terria = this.props.terria;

        let featureInfoSections = null;
        let featureInfoTemplate;
        let totalFeaturesCount = 0;
        let hiddenNumber;
        let maximumShownFeatureInfos = terria.configParameters.defaultMaximumShownFeatureInfos;

        if (defined(features)) {
            // Display no more than defined number of feature infos
            totalFeaturesCount = features.length;
            if (defined(catalogItem)) {
                maximumShownFeatureInfos = catalogItem.maximumShownFeatureInfos;
                featureInfoTemplate = catalogItem.featureInfoTemplate;
            }
            hiddenNumber = totalFeaturesCount - maximumShownFeatureInfos;  // A positive hiddenNumber => some are hidden; negative means none are.
            featureInfoSections = features.slice(0, maximumShownFeatureInfos).map((feature, i) => {
                return (
                    <FeatureInfoSection key={i}
                        viewState={this.props.viewState}
                        catalogItem={catalogItem}
                        feature={feature}
                        position={terria.pickedFeatures && terria.pickedFeatures.pickPosition}
                        template={featureInfoTemplate}
                        isOpen={feature === terria.selectedFeature || this.props.printView}
                        onClickHeader={this.props.onToggleOpen}
                        printView={this.props.printView}
                    />
                );
            });

        }

        return (
            <li className={Styles.group}>
                <ul className={Styles.sections}>
                    <If condition={hiddenNumber === 1}>
                      <li className={Styles.messageItem}>
                        <strong>More than {maximumShownFeatureInfos} {catalogItem.name} features were found.</strong><br/>
                        The first {maximumShownFeatureInfos} are shown below.
                      </li>
                    </If>
                    <If condition={hiddenNumber > 1}>
                      <li className={Styles.messageItem}>
                        <strong>{totalFeaturesCount} {catalogItem.name} features were found.</strong><br/>
                        The first {maximumShownFeatureInfos} are shown below.
                      </li>
                    </If>

                    {featureInfoSections}
                </ul>
            </li>
        );
    },
});

module.exports = FeatureInfoCatalogItem;
