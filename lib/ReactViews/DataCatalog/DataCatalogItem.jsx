'use strict';

import addedByUser from '../../Core/addedByUser';
import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';
import React from 'react';

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    renderIconClass() {
        if (this.props.item.isEnabled) {
            if (this.props.item.isLoading) {
                return 'btn--loading-on-map';
            }
            return 'btn--remove-from-map';
        }
        return 'btn--add-to-map';
    },

    renderItemIcon() {
        if(this.props.item.isMappable) {
            return <button type='button' onClick={this.toggleEnable} title="add to map" className={'btn btn--catalog-item--action ' + (this.renderIconClass())} />;
        }
        return <button type='button' onClick={this.setPreviewedItem} title="preview" className='btn btn--catalog-item--action btn--stats-bars' />;
    },

    toggleEnable() {
        this.props.item.toggleEnabled();
        // set preview as well
        this.props.viewState.viewCatalogItem(this.props.item);
        // mobile switch to nowvewing
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.preview);
    },

    setPreviewedItem() {
        raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
        this.props.item.load();
        this.props.viewState.viewCatalogItem(this.props.item);
        // mobile switch to nowvewing
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.preview);
    },

    isSelected() {
        return addedByUser(this.props.item) ?
            this.props.viewState.userDataPreviewedItem === this.props.item :
            this.props.viewState.previewedItem === this.props.item;
    },

    render() {
        const item = this.props.item;
        return (
            <li className={classNames('clearfix data-catalog-item', {'is-previewed': this.isSelected()})}>
                <button type='button'
                        onClick={this.setPreviewedItem}
                        className={`btn btn--catalog-item ${item.isMappable ? 'catalog-item' : 'service-item'}`}>
                    {item.name}
                </button>
                <Choose>
                    <When condition={!defined(item.invoke)}>
                        <button type='button' onClick={this.toggleEnable}
                                title="add to map"
                                className={'btn btn--catalog-item--action ' + (this.renderIconClass())}
                        />
                    </When>
                    <Otherwise>
                        <button type='button'
                                onClick={this.setPreviewedItem}
                                title="preview"
                                className='btn btn--catalog-item--action btn--stats-bars'
                        />
                    </Otherwise>
                </Choose>
            </li>
        );
    }
});

module.exports = DataCatalogItem;
