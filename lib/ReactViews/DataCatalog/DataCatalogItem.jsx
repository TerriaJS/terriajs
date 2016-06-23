import React from 'react';
import classNames from 'classnames';

import addedByUser from '../../Core/addedByUser';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';
import CatalogItem from './CatalogItem';

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    toggleEnable(event) {
        this.props.item.toggleEnabled();
        // set preview as well
        this.props.viewState.viewCatalogItem(this.props.item);
        // mobile switch to nowvewing
        this.props.viewState.switchMobileView(this.props.viewState.mobileViewOptions.preview);
        if (this.props.viewState.previewedItem.isEnabled === true &&
            this.props.viewState.closeModalAfterAdd === true &&
            !event.shiftKey && !event.ctrlKey) {

            // close modal window
            this.props.viewState.explorerPanelIsVisible = false;
        }
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
            <CatalogItem
                onTextClick={this.setPreviewedItem}
                selected={this.isSelected()}
                text={item.name}
                btnState={this.getState()}
                onBtnClick={defined(item.invoke) ? this.setPreviewedItem : this.toggleEnable}
            />
        );
    },

    getState() {
        if (this.props.item.isLoading) {
            return 'loading';
        } else if (this.props.item.isEnabled) {
            return 'remove';
        } else if (!defined(this.props.item.invoke)) {
            return 'add';
        } else {
            return 'stats';
        }
    }
});

module.exports = DataCatalogItem;
