import React from 'react';

import defined from 'terriajs-cesium/Source/Core/defined';

import addedByUser from '../../Core/addedByUser';
import CatalogItem from './CatalogItem';
import getAncestors from '../../Models/getAncestors';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';

const STATE_TO_TITLE = {
    loading: 'Loading...',
    remove: 'Remove this item',
    add: 'Add this item. Hold down "shift" to keep the data catalogue open.'
};

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        overrideState: React.PropTypes.string,
        onActionButtonClicked: React.PropTypes.func
    },

    onBtnClicked(event) {
        if (this.props.onActionButtonClicked) {
            this.props.onActionButtonClicked(this.props.item);
            return;
        }

        if (defined(this.props.item.invoke) || this.props.viewState.useSmallScreenInterface) {
            this.setPreviewedItem();
        } else {
            this.toggleEnable(event);
        }
    },

    toggleEnable(event) {
        this.props.item.toggleEnabled();

        // set preview as well
        this.setPreviewedItem();

        if (this.props.item.isEnabled === true && !event.shiftKey && !event.ctrlKey) {
            // close modal window
            this.props.viewState.explorerPanelIsVisible = false;
            this.props.viewState.mobileView = null;
            if (this.props.viewState.firstTimeAddingData) {
                this.props.viewState.featureInfoPanelIsVisible = true;
            }
        }
    },

    setPreviewedItem() {
        raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
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
                text={item.nameInCatalog}
                title={getAncestors(item).map(member => member.nameInCatalog).join(' → ')}
                btnState={this.getState()}
                onBtnClick={this.onBtnClicked}
                titleOverrides={STATE_TO_TITLE}
            />
        );
    },

    getState() {
        if (this.props.overrideState) {
            return this.props.overrideState;
        } else if (this.props.item.isLoading) {
            return 'loading';
        } else if (this.props.viewState.useSmallScreenInterface) {
            return 'preview';
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
