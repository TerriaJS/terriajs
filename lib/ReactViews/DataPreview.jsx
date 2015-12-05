'use strict';

var React = require('react');
var markdownToHtml = require('terriajs/lib/Core/markdownToHtml');

var DataPreview = React.createClass({
    propTypes: {
        previewed: React.PropTypes.object
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
        var url = 'http://placehold.it/600x300?text=preview' + previewed.name.replace(/\s+/g, '-').toLowerCase();

        return (<figure>
                <img src={url}/>
                <figcaption>
                <div className="title clearfix">
                <h4 className="col col-6">{previewed.name}</h4>
                <ul className="list-reset flex col col-6 search-preview-action">
                <li><button className="btn" title ="share this data"><i className="icon icon-share"></i></button></li>
                <li><button onClick={this.toggleOnMap} className={'btn btn-preview-add-to-map ' + (previewed.isEnabled ? 'is-enabled' : '')} title ={previewed.isEnabled ? 'remove from map' : 'add to map'}><i className="icon icon-plus"></i>{previewed.isEnabled ? 'Remove from map' : 'Add to map'}</button></li>
                </ul>
                </div>
                <p dangerouslySetInnerHTML={{__html: markdownToHtml(previewed.description)}}></p>
                </figcaption>
                </figure>);
    }
});
module.exports = DataPreview;
