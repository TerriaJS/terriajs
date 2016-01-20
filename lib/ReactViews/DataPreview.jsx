'use strict';

const React = require('react');
const markdownToHtml = require('terriajs/lib/Core/markdownToHtml');
const DataPreviewMap = require('./DataPreviewMap.jsx');
const defined = require('terriajs-cesium/Source/Core/defined');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

//Data preview section, for the preview map see DataPreviewMap
let DataPreview = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes: {
        previewed: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    getDefaultProps: function() {
        return {
            previewed: {
                name: 'Select a Dataset to see preview',
                description: ''
            }
        };
    },

    toggleOnMap: function() {
        //From the review map we can turn on/off datasets for the main map
        this.props.previewed.isEnabled = !this.props.previewed.isEnabled;
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        let previewed = this.props.previewed;
        let action = null;

        if (defined(previewed.type)){
            action = (<ul className="list-reset flex col col-5 data-preview-action">
                <li><button className="btn" title ="share this data"><i className="icon icon-share"></i></button></li>
                <li><button onClick={this.toggleOnMap} className={'btn ' + (previewed.isEnabled ? 'btn-preview-remove-from-map' : 'btn-preview-add-to-map')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}><i className={previewed.isEnabled ? 'icon icon-minus2' : 'icon icon-plus'}></i>{previewed.isEnabled ? 'Remove' : 'Add'}</button></li>
                </ul>);
        }
        return (<figure><DataPreviewMap terria={this.props.terria} previewed={this.props.previewed}/><figcaption>
                 <div className="title clearfix">
                <h4 className="col col-7">{previewed.name}</h4>
                {action}
                </div>
                <p dangerouslySetInnerHTML={{__html: markdownToHtml(previewed.description)}}></p>
                </figcaption>
                </figure>);
    }
});
module.exports = DataPreview;
