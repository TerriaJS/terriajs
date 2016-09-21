import React from 'react';
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

    onBtnClicked(event) {
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
            if(this.props.viewState.firstTime) {
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
                text={item.name}
                btnState={this.getState()}
                onBtnClick={this.onBtnClicked}
            />
        );
    },

    getState() {
        if (this.props.item.isLoading) {
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
