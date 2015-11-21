'use strict';

/*global require*/
var FeatureInfoSection = require('./FeatureInfoSection.jsx'),
    Loader = require('./Loader.jsx'),
    when = require('terriajs-cesium/Source/ThirdParty/when');

var FeatureInfoPanel = React.createClass({
  getInitialState: function() {
    return {
      pickedFeatures: undefined,
      isVisible: true
    };
  },

  componentWillMount: function(){
    this.getFeatures();
  },

  componentWillReceiveProps: function(){
    this.setState({
      isVisible: true
    });

    this.getFeatures();
  },

  getFeatures: function(){
    var that = this;
    when(that.props.terria.pickedFeatures.allFeaturesAvailablePromise).then(function(){
      that.setState({
        // show top three results for now
        pickedFeatures: that.props.terria.pickedFeatures.features.slice(0,3)
      });
    });
  },

  closeFeatureInfoPanel: function(){
    this.setState({
      isVisible: false,
      pickedFeatures: undefined
    })
  },

  render: function() {
    var selectedFeature = this.state.pickedFeatures;
    var clock = this.props.terria.clock;
    var content = <Loader/>;
    if(selectedFeature && selectedFeature.length > 0){
      content = selectedFeature.map(function(feature, i) {
          return (<FeatureInfoSection key={i} feature={feature} clock={clock} />);
        });
    }
    return(
      <div className="feature-info-panel" aria-hidden={!this.state.isVisible}>
      <button onClick={this.closeFeatureInfoPanel} className="btn modal-btn right" title="Close data panel"><i className="fa fa-times"></i></button>
      <ul className="list-reset">{content}</ul>
      </div>
      );
  }
});

//to add multiple catalog when several dataset turned on at the same time

function addSectionsForFeatures(viewModel, features) {
    // Only show sections up to a limit for each catalog item.

    var counts = []; // an array of {catalogItem: , count: } objects
    features.forEach(function(feature) {
        if (!defined(feature.position)) {
            feature.position = features.pickPosition;
        }
        var catalogItem = calculateCatalogItem(viewModel.terria.nowViewing, feature);
        if (!defined(catalogItem)) {
            viewModel.addSection(newSectionfromFeature(viewModel, feature));
        } else {
            var newItem = true;
            var countOfCatalogItem = 0;
            // only show features from each catalog item up to their maximumShownFeatureInfos
            for (var i = counts.length - 1; i >= 0; i--) {
                if (catalogItem === counts[i].catalogItem) {
                    newItem = false;
                    countOfCatalogItem = counts[i].count;
                    counts[i].count = countOfCatalogItem + 1;
                }
            }
            if (newItem) {
                counts.push({catalogItem: catalogItem, count: 1});
            }
            if (countOfCatalogItem < catalogItem.maximumShownFeatureInfos) {
                viewModel.addSection(newSectionfromFeature(viewModel, feature, catalogItem));
            }
        }
    });
    // if any counts were exceeded, add a message to the view model
    for (var i = counts.length - 1; i >= 0; i--) {
        var numberShown = counts[i].catalogItem.maximumShownFeatureInfos;
        var hiddenNumber = counts[i].count - numberShown;
        if (hiddenNumber === 1) {
            // if only one more, there may be more hidden layers viewModel were not requested, so don't specify the exact total number
            viewModel.message += '<p>More than ' + numberShown + ' ' + counts[i].catalogItem.name + ' features were found. ' +
            'The first ' + numberShown + ' are shown below.</p>';
        }
        if (hiddenNumber > 1) {
            viewModel.message += '<p>' + counts[i].count + ' ' + counts[i].catalogItem.name + ' features were found. ' +
            'The first ' + numberShown + ' are shown below.</p>';
        }
    }
}

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    var result, i;
    if (!defined(nowViewing)) {
        // so that specs do not need to define a nowViewing
        return undefined;
    }
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        var dataSource = feature.entityCollection.owner;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].dataSource === dataSource) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // If there is no data source, but there is an imagery layer (eg. ArcGIS)
    // we can match up the imagery layer on the feature with a now-viewing item.
    if (defined(feature.imageryLayer)) {
        var imageryLayer = feature.imageryLayer;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].imageryLayer === imageryLayer) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // otherwise, no luck
    return undefined;
}

module.exports = FeatureInfoPanel;
