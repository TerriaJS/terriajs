import React from 'react';
import classNames from 'classnames';

import DataCatalogMember from '../DataCatalog/DataCatalogMember.jsx';
import DataPreview from '../Preview/DataPreview.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import MobileSearch from './MobileSearch.jsx';
import WorkbenchList from '../Workbench/WorkbenchList.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Icon from '../Icon';

import Styles from './mobile-modal-window.scss';

const MobileModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired
    },

    renderModalContent() {
        switch (this.props.viewState.mobileView) {
            case this.props.viewState.mobileViewOptions.search:
                return (
                    <MobileSearch terria={this.props.terria} viewState={this.props.viewState}/>
                );
            case this.props.viewState.mobileViewOptions.data:
                return (
                    <ul className={Styles.dataCatalog}>
                        {this.props.terria.catalog.group.items.filter(defined)
                            .map((item, i) => (
                                <DataCatalogMember viewState={this.props.viewState}
                                                   member={item}
                                                   key={item.uniqueId}
                                />
                            ))
                        }
                    </ul>
                );
            case this.props.viewState.mobileViewOptions.preview:
                return (
                    <DataPreview terria={this.props.terria}
                                 viewState={this.props.viewState}
                                 previewed={this.props.viewState.previewedItem}
                    />
                );
            case this.props.viewState.mobileViewOptions.nowViewing:
                return (
                    <WorkbenchList viewState={this.props.viewState}
                                   terria={this.props.terria}
                    />
                );
            default:
                return null;
        }
    },

    onClearMobileUI() {
        this.props.viewState.switchMobileView(null);
        this.props.viewState.explorerPanelIsVisible = false;
    },

    componentWillReceiveProps() {
        if ((this.props.terria.nowViewing.items.length === 0) &&
            (this.props.viewState.mobileView === this.props.viewState.mobileViewOptions.nowViewing)) {
            this.props.viewState.switchMobileView(null);
            this.props.viewState.explorerPanelIsVisible = false;
        }
    },

    goBack() {
        this.props.viewState.mobileView = this.props.viewState.mobileViewOptions.data;
    },

    render() {
        const modalClass = classNames(Styles.mobileModal, {
            [Styles.isOpen]: this.props.viewState.explorerPanelIsVisible && this.props.viewState.mobileView
        });
        const mobileView = this.props.viewState.mobileView;
        
        return (
            <div className={modalClass}>
                <div className={Styles.modalBg}>
                    <div className={Styles.modalTop}>
                        <If condition={this.props.viewState.explorerPanelIsVisible && mobileView}>
                            <button type='button' className={Styles.doneButton} onClick={this.onClearMobileUI}>Done
                            </button>
                        </If>
                        <button type='button'
                                disabled={mobileView !== this.props.viewState.mobileViewOptions.preview}
                                className={classNames(
                                    Styles.backButton,
                                    {[Styles.backButtonInactive]: mobileView !== this.props.viewState.mobileViewOptions.preview}
                                )}
                                onClick={this.goBack}>
                            <Icon className={Styles.iconBack} glyph={Icon.GLYPHS.left}/>
                        </button>
                    </div>

                    {this.renderModalContent()}
                </div>
            </div>
        );
    }
});
module.exports = MobileModalWindow;
