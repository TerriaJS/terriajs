'use strict';

const React = require('react');
const ObserveModelMixin = require('./ObserveModelMixin');
const PureRenderMixin = require('react-addons-pure-render-mixin');

//Individual dataset
var DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin, PureRenderMixin],
    propTypes:{
        item: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            isPreviewed: false
        };
    },

    addToPreview: function(event) {
        event.preventDefault();

        if (this.state.isPreviewed === false){
          window.previewUpdate.raiseEvent(this.props.item);
        }

        this.setState({
            isPreviewed: !this.state.isPreviewed
        });
    },

    addToMap: function(event) {
        event.preventDefault();

        this.props.item.toggleEnabled();
        this.addToPreview(event);
    },

    render: function() {
        var item = this.props.item;
        var iconClass;

        if (item.isEnabled){
            if (item.isLoading){
                iconClass = 'icon icon-loader';
            } else {
                iconClass = 'icon icon-minus';
            }
        } else {
            iconClass = 'icon icon-add';
        }

        return (
            <li className="clearfix data-catalog-item flex">
                <button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'>
                    <i className={iconClass}> </i>
                </button>
                <button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button>
            </li>
        );
    }
});

module.exports = DataCatalogItem;
