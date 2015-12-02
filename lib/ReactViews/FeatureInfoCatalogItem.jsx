'use strict';
var FeatureInfoSection = require('./FeatureInfoSection.jsx'),
    defined = require('terriajs-cesium/Source/Core/defined');

var FeatureInfoCatalogItem = React.createClass({
    getInitialState: function() {
        return {
            isOpen: false
        };
    },
    toggleCatalog: function() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },
    render: function() {
        var content = null;
        var count = null;
        var features = this.props.features;
        var clock = this.props.clock;
        var maximumShownFeatureInfos = features.catalogItem.maximumShownFeatureInfos;
        var featureInfoTemplate = features.catalogItem.featureInfoTemplate;
        var totalFeaturesCount = features.features.length;
        if (defined(features.catalogItem)) {
            count = totalFeaturesCount > maximumShownFeatureInfos ? (<li className='p1'>{maximumShownFeatureInfos}{' of '}{totalFeaturesCount}{' results are shown '}</li>) : null;

            content = features.features.slice(0, maximumShownFeatureInfos).map(function(feature, i) {
                return (<FeatureInfoSection key={i} feature={feature} clock={clock} template={featureInfoTemplate} />)
            });

        } else {
            content = <FeatureInfoSection feature={features} clock={clock} />
        }
        return <li><button className='btn' onClick={this.toggleCatalog}>{features.catalogItem? features.catalogItem.name : 'no matching catalog items' }</button> <ul aria-hidden={!this.state.isOpen} className='list-reset feature-info-panel-section'>{count}{content}</ul></li>;
    }
});
module.exports = FeatureInfoCatalogItem;
