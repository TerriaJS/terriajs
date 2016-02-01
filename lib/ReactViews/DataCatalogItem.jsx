'use strict';

const React = require('react');
const ObserveModelMixin = require('./ObserveModelMixin');

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object,
        previewedCatalogItem: React.PropTypes.object,
        onPreviewedCatalogItemChanged: React.PropTypes.func
    },

    addToPreview() {
        this.props.onPreviewedCatalogItemChanged(this.props.item);
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
            <li className={(this.props.previewedCatalogItem === item ? 'is-previewed' : '') + ' clearfix data-catalog-item flex' }>
                <button onClick={this.addToMap} title="add to map" className='btn relative btn-add-to-map'>
                    <i className={this.renderIconClass(item)}></i>
                </button>
                <button onClick={this.addToPreview} className='btn btn-catalog-item relative'>{item.name}</button>
            </li>);
    }
});

module.exports = DataCatalogItem;
