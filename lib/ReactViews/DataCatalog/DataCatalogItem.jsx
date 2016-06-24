'use strict';

import addedByUser from '../../Core/addedByUser';
import classNames from 'classnames';
import defined from 'terriajs-cesium/Source/Core/defined';
import ObserveModelMixin from '../ObserveModelMixin';
import raiseErrorOnRejectedPromise from '../../Models/raiseErrorOnRejectedPromise';
import React from 'react';
import Icon from "../Icon.jsx";

// Individual dataset
const DataCatalogItem = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    renderIcons() {
        if (this.props.item.isEnabled) {
            if (this.props.item.isLoading) {
                return <Icon glyph={Icon.GLYPHS.loader}/>;
            }
            return <Icon glyph={Icon.GLYPHS.remove}/>;
        }
        return <Icon glyph={Icon.GLYPHS.add}/>;
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
                                className={'btn btn--catalog-item--action '}>
                                {this.renderIcons()}
                        </button>
                    </When>
                    <Otherwise>
                        <button type='button'
                                onClick={this.setPreviewedItem}
                                title="preview"
                                className='btn btn--catalog-item--action'>
                                <Icon glyph={Icon.GLYPHS.barChart}/>
                        </button>
                    </Otherwise>
                </Choose>
            </li>
        );
    }
});

module.exports = DataCatalogItem;
