'use strict';

import classNames from 'classnames';
import DataCatalogMember from '../DataCatalog/DataCatalogMember.jsx';
import DataPreview from '../Preview/DataPreview.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import MobileSearch from './MobileSearch.jsx';
import WorkbenchList from '../Workbench/WorkbenchList.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import Styles from './mobile-modal-window.scss';

const MobileModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired
    },

    renderModalContent() {
        switch(this.props.viewState.mobileView) {
        case this.props.viewState.mobileViewOptions.search:
            return <div className={Styles.modalBg}>
                    <MobileSearch terria={this.props.terria}
                                  viewState={this.props.viewState}
                   /></div>;
        case this.props.viewState.mobileViewOptions.data:
            return <div className={Styles.modalBg}>
                    <ul className='data-catalog'>
                    {this.props.terria.catalog.group.items.filter(defined)
                          .map((item, i) => (
                            <DataCatalogMember viewState={this.props.viewState}
                                               member={item}
                                               key={item.uniqueId}
                            />
                    ))}
                </ul>
            </div>;
        case this.props.viewState.mobileViewOptions.preview:
            return <div className={Styles.modalBg}>
                        <DataPreview terria={this.props.terria}
                                     viewState={this.props.viewState}
                                     previewed={this.props.viewState.previewedItem}
                        />
                    </div>;
        case this.props.viewState.mobileViewOptions.nowViewing:
            return <div className={Styles.modalBg}>
                        <WorkbenchList viewState={this.props.viewState}
                                       terria={this.props.terria}
                        />
                    </div>;
        default:
            return null;
        }
    },

    onClearMobileUI() {
        this.props.viewState.switchMobileView(null);
        this.props.viewState.toggleModal(false);
    },

    componentWillReceiveProps() {
        if((this.props.terria.nowViewing.items.length === 0) &&
          (this.props.viewState.mobileView === this.props.viewState.mobileViewOptions.nowViewing)) {
            this.props.viewState.switchMobileView(null);
            this.props.viewState.toggleModal(false);
        }
    },

    render() {
        let modalClass = classNames(Styles.mobileModal, {
            [Styles.isOpen]: this.props.viewState.modalVisible && this.props.viewState.mobileView
        });
        return <div className={modalClass}>
                    {(this.props.viewState.modalVisible && this.props.viewState.mobileView) && <button type='button' className={Styles.closeModal} onClick={this.onClearMobileUI}>Done</button>}
                    {this.renderModalContent()}
                </div>;
    }
});
module.exports = MobileModalWindow;
