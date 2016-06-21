import React from 'react';
import classNames from 'classnames';

import addedByUser from '../../Core/addedByUser';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';

import Styles from './data-catalog-item.scss';

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
            <li className={classNames(Styles.root)}>
                <button type='button'
                        onClick={this.setPreviewedItem}
                        className={classNames(
                            Styles.btnCatalogItem,
                            {[Styles.btnCatalogItemIsPreviewed]: this.isSelected()}
                        )}>
                    {item.name}
                </button>
                <Choose>
                    <When condition={!defined(item.invoke)}>
                        <button type='button' onClick={this.toggleEnable}
                                title="add to map"
                                className={classNames(Styles.btnAction, this.renderIconClass())}
                        />
                    </When>
                    <Otherwise>
                        <button type='button'
                                onClick={this.setPreviewedItem}
                                title="preview"
                                className={classNames(Styles.btnAction, Styles.btnActionStatsBars)}
                        />
                    </Otherwise>
                </Choose>
            </li>
        );
    },

    renderIconClass() {
        if (this.props.item.isEnabled) {
            if (this.props.item.isLoading) {
                return Styles.btnActionLoadingOnMap;
            }
            return Styles.btnActionRemoveFromMap;
        }
        return Styles.btnActionAddToMap;
    }
});

module.exports = DataCatalogItem;
