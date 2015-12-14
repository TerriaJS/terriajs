'use strict';

var React = require('react');
var markdownToHtml = require('terriajs/lib/Core/markdownToHtml');
var DataPreviewMap = require('./DataPreviewMap.jsx');
var defined = require('terriajs-cesium/Source/Core/defined');


var DataPreview = React.createClass({
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
        this.props.previewed.isEnabled = !this.props.previewed.isEnabled;
        window.nowViewingUpdate.raiseEvent();
    },

    render: function() {
        var previewed = this.props.previewed;
        var action = null;

        if (defined(previewed.type)){
            action = (<ul className="list-reset flex col col-5 data-preview-action">
                <li><button className="btn" title ="share this data"><i className="icon icon-share"></i></button></li>
                <li><button onClick={this.toggleOnMap} className={'btn ' + (previewed.isEnabled ? 'btn-preview-remove-from-map' : 'btn-preview-add-to-map')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}><i className="icon icon-plus"></i>{previewed.isEnabled ? 'Remove from map' : 'Add to map'}</button></li>
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
