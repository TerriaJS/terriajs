'use strict';

const React = require('react');
const markdownToHtml = require('terriajs/lib/Core/markdownToHtml');
const DataPreviewMap = require('./DataPreviewMap.jsx');
const defined = require('terriajs-cesium/Source/Core/defined');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

// Data preview section, for the preview map see DataPreviewMap
const DataPreview = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    toggleOnMap() {
        this.props.previewed.isEnabled = !this.props.previewed.isEnabled;
    },

    infoMarkup() {
        return {__html: markdownToHtml(this.props.previewed.description)};
    },

    renderActions(previewed) {
        if (previewed && defined(previewed.type)) {
            return (
                <div>
                <div className="clearfix">
                    <h4 className="col col-8">{previewed.name}</h4>
                    <button onClick={this.toggleOnMap} className={'btn btn-preview-toggle col col-4 ' + (previewed.isEnabled ? 'btn-add' : 'btn-remove')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}>{previewed.isEnabled ? 'Remove' : 'Add'}</button>
                </div>
                <div className="clearfix" dangerouslySetInnerHTML={this.infoMarkup()}></div>
                </div>
                );
        }
    },

    render() {
        const previewed = this.props.previewed;

        return (<figure>
                <DataPreviewMap terria={this.props.terria}
                                previewed={this.props.previewed}
                />
                <figcaption>
                    {this.renderActions(previewed)}
                </figcaption>
                </figure>);
    }
});
module.exports = DataPreview;
