'use strict';

const React = require('react');
const markdownToHtml = require('terriajs/lib/Core/markdownToHtml');
const DataPreviewMap = require('./DataPreviewMap.jsx');
const defined = require('terriajs-cesium/Source/Core/defined');
const ObserveModelMixin = require('./ObserveModelMixin');

// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        previewedCatalogItem: React.PropTypes.object,
    },

    toggleOnMap() {
        this.props.previewedCatalogItem.isEnabled = !this.props.previewedCatalogItem.isEnabled;
    },

    infoMarkup() {
        return {
            __html: markdownToHtml(this.props.previewedCatalogItem.description)
        };
    },

    renderActions(previewed) {
        if (previewed && defined(previewed.type)) {
            return (
                <div>
                    <div className="clearfix">
                        <h4 className="col col-8">{previewed.name}</h4>
                        <button onClick={this.toggleOnMap} className={'btn btn-preview-toggle col col-4 ' + (previewed.isEnabled ? 'btn-remove-previewed' : 'btn-add-previewed')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}>{previewed.isEnabled ? 'Remove' : 'Add'}</button>
                    </div>
                    <div className="clearfix" dangerouslySetInnerHTML={this.infoMarkup()}></div>
                </div>);
        }
    },

    render() {
        const previewed = this.props.previewedCatalogItem;

        return (
            <figure>
              <DataPreviewMap terria={this.props.terria} previewedCatalogItem={this.props.previewedCatalogItem} />
              <figcaption>
                {this.renderActions(previewed)}
              </figcaption>
            </figure>);
    }
});

module.exports = DataPreview;
