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

    addToMap() {
        this.addToPreview();
        this.props.item.toggleEnabled();
    },

    renderIconClass(item) {
        if (item.isEnabled) {
            if (item.isLoading) {
                return 'icon icon-loader';
            }
            return 'icon icon-remove';
        }
        return 'icon icon-add';
    },

    render() {
        const item = this.props.item;
        return (
            <li className={(this.props.previewedCatalogItem === item ? 'is-previewed' : '') + ' clearfix data-catalog-item' }>
                <button onClick={this.addToPreview} className='btn btn-catalog-item'>{item.name}</button>
                <button onClick={this.addToMap} title="add to map" className='btn btn-add-to-map'>
                    <i className={this.renderIconClass(item)}></i>
                </button>
            </li>);
    }
});

module.exports = DataCatalogItem;
