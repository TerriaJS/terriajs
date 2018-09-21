import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import defined from 'terriajs-cesium/Source/Core/defined';
import addedByUser from '../../Core/addedByUser';
import canBeDeleted from '../../Core/canBeDeleted';
import CatalogItem from './CatalogItem';
import getAncestors from '../../Models/getAncestors';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';

const STATE_TO_TITLE = {
    loading: 'Loading...',
    remove: 'Remove this item',
    add: 'Add this item. Hold down "shift" to keep the data catalogue open.',
    trash: 'delete this user-added data.'
};

// Individual dataset
const DataCatalogItem = createReactClass({
    displayName: 'DataCatalogItem',
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired
    },

    onBtnClicked(event) {
        if (defined(this.props.item.invoke) || this.props.viewState.useSmallScreenInterface) {
            this.setPreviewedItem();
        } else if(canBeDeleted(this.props.item)) {
            this.props.item.isEnabled = false;
            if(this.props.item.parent) {
              const itemIndex = this.props.item.parent.items.indexOf(this.props.item);
              this.props.item.parent.items.splice(itemIndex, 1);
            }
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
        this.props.viewState.viewCatalogMember(this.props.item);
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
        if (this.props.item.isLoading) {
            return 'loading';
        } else if (this.props.viewState.useSmallScreenInterface) {
            return 'preview';
        } else if (canBeDeleted(this.props.item)) {
            return 'trash';
        } else if(this.props.item.isUserSupplied){
            return null;
        }else if (this.props.item.isEnabled) {
            return 'remove';
        } else if (!defined(this.props.item.invoke)) {
            return 'add';
        }  else {
            return 'stats';
        }
    },
});

module.exports = DataCatalogItem;
