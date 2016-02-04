'use strict';

import React from 'react';
import ObserveModelMixin from './ObserveModelMixin';
import classNames from 'classnames';

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
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

    toggleEnable() {
        this.props.item.toggleEnabled();
    },

    setPreviewedItem() {
        this.props.viewState.previewedItem = this.props.item;
    },

    isSelected() {
        return this.props.viewState.previewedItem === this.props.item;
    },

    render() {
        const item = this.props.item;
        return (
            <li className={classNames('clearfix', 'data-catalog-item', {'is-previewed': this.isSelected()})}>
                <button onClick={this.setPreviewedItem} className='btn btn-catalog-item'>{item.name}</button>
                <button onClick={this.toggleEnable} title="add to map" className='btn btn-add-to-map'>
                    <i className={this.renderIconClass(item)}></i>
                </button>
            </li>
        );
    }
});

module.exports = DataCatalogItem;
