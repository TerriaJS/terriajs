import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import defined from 'terriajs-cesium/Source/Core/defined';
import addedByUser from '../../Core/addedByUser';
import removeUserAddedData from '../../Models/removeUserAddedData';
import CatalogItem from './CatalogItem';
import getAncestors from '../../Models/getAncestors';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';
import { observer } from 'mobx-react';

const STATE_TO_TITLE = {
    loading: 'Loading...',
    remove: 'Remove from map',
    add: 'Add this item. Hold down "shift" to keep the data catalogue open.',
    trash: 'Remove from catalogue'
};

// Individual dataset
const DataCatalogItem = observer(createReactClass({
    displayName: 'DataCatalogItem',

    propTypes: {
        item: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        overrideState: PropTypes.string,
        onActionButtonClicked: PropTypes.func,
        removable: PropTypes.bool,
        terria: PropTypes.object,
        ancestors: PropTypes.array
    },

    onBtnClicked(event) {
        if (this.props.onActionButtonClicked) {
            this.props.onActionButtonClicked(this.props.item);
            return
        }

        if (defined(this.props.item.invoke) || this.props.viewState.useSmallScreenInterface) {
            this.setPreviewedItem();
        } else if(this.props.removable) {
            removeUserAddedData(this.props.terria, this.props.item);
        } else {
            this.toggleEnable(event);
        }
    },

    toggleEnable(event) {
        const itemWorkbenchIndex = this.props.item.terria.workbench.items.indexOf(this.props.item)
        if (itemWorkbenchIndex === -1) {
            if (this.props.item.loadData) {
                this.props.item.loadData();
            }
            this.props.item.terria.workbench.items.push(this.props.item);
            this.props.item.ancestors = this.props.ancestors;
        } else {
            this.props.item.terria.workbench.items.splice(itemWorkbenchIndex, 1);
            this.props.item.ancestors = undefined;
        }

        // this.props.item.toggleEnabled();

        // // set preview as well
        // this.setPreviewedItem();

        // if (this.props.item.isEnabled === true && !event.shiftKey && !event.ctrlKey) {
        //     // close modal window
        //     this.props.viewState.explorerPanelIsVisible = false;
        //     this.props.viewState.mobileView = null;
        //     if (this.props.viewState.firstTimeAddingData) {
        //         this.props.viewState.featureInfoPanelIsVisible = true;
        //     }
        // }
    },

    setPreviewedItem() {
        //raiseErrorOnRejectedPromise(this.props.item.terria, this.props.item.load());
        if (this.props.item.loadMetadata) {
            this.props.item.loadMetadata();
            this.props.item.loadMetadata();
            this.props.item.loadMetadata();
            this.props.item.loadMetadata();
        }
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
                text={item.nameInCatalog + ': ' + this.props.ancestors.map(m => m.nameInCatalog).join(' -> ')}
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
        } else if (this.props.removable) {
            return 'trash';
        } else if(addedByUser(this.props.item)) {
            return null;
        }else if (this.props.item.isEnabled) {
            return 'remove';
        } else if (!defined(this.props.item.invoke)) {
            return 'add';
        }  else {
            return 'stats';
        }
    },
}));

module.exports = DataCatalogItem;
