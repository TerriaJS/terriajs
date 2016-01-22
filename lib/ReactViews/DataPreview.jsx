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

    getDefaultProps() {
        return {
            previewed: {
                name: 'Select a Dataset to see preview',
                description: ''
            }
        };
    },

    toggleOnMap() {
        //From the review map we can turn on/off datasets for the main map
        this.props.previewed.isEnabled = !this.props.previewed.isEnabled;
        window.nowViewingUpdate.raiseEvent();
    },

    renderActions(previewed) {
        if (defined(previewed.type)) {
            return (<ul className="list-reset flex col col-5 data-preview-action">
                <li><button className="btn" title ="share this data"><i className="icon icon-share"></i></button></li>
                <li><button onClick={this.toggleOnMap} className={'btn ' + (previewed.isEnabled ? 'btn-preview-remove-from-map' : 'btn-preview-add-to-map')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}><i className={previewed.isEnabled ? 'icon icon-circle-minus' : 'icon icon-circle-plus'}></i>{previewed.isEnabled ? 'Remove' : 'Add'}</button></li>
                </ul>);
        }
    },

    render() {
        let previewed = this.props.previewed;

        return (<figure><DataPreviewMap terria={this.props.terria} previewed={this.props.previewed}/><figcaption>
                 <div className="title clearfix">
                <h4 className="col col-7">{previewed.name}</h4>
                {this.renderActions(previewed)}
                </div>
                <p dangerouslySetInnerHTML={{__html: markdownToHtml(previewed.description)}}></p>
                </figcaption>
                </figure>);
    }
});
module.exports = DataPreview;
