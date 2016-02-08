'use strict';

const React = require('react');
const ObserveModelMixin = require('./ObserveModelMixin');

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object,
        previewedCatalogItem: React.PropTypes.object,
        onPreviewedCatalogItemChanged: React.PropTypes.func,
        userData: React.PropTypes.bool
    },

    addToPreview() {
        this.props.onPreviewedCatalogItemChanged(this.props.item, this.props.userData);
    },

    toggleEnable() {
        this.addToPreview();
        this.props.item.toggleEnabled();
    },

    renderClass(item) {
        if (item.isEnabled) {
            if (item.isLoading) {
                return 'btn--loading-on-map';
            }
            return 'btn--remove-from-map';
        }
        return 'btn--add-to-map';
    },

    render() {
        const item = this.props.item;
        return (
            <li className={(this.props.previewedCatalogItem === item ? 'is-previewed' : '') + ' data-catalog-item' }>
               <button onClick={this.addToPreview} className='btn btn--catalog-item'>{item.name}</button>
               <button onClick={this.toggleEnable} title="add or remove on map" className={'btn btn--catalog-item--action ' + (this.renderClass(item))}></button>
            </li>);
    }
});

module.exports = DataCatalogItem;
