'use strict';

import classNames from 'classnames';
import DataCatalogMember from '../DataCatalog/DataCatalogMember.jsx';
import DataPreview from '../Preview/DataPreview.jsx';
import defined from 'terriajs-cesium/Source/Core/defined';
import MobileSearch from './MobileSearch.jsx';
import NowViewingContainer from '../NowViewing/NowViewingContainer.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';


const MobileModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        searches: React.PropTypes.array
    },

    renderModalContent() {
        switch(this.props.viewState.mobileView) {
        case this.props.viewState.mobileViewOptions.search:
            return <div className='modal--mobile-bg search'>
                    <MobileSearch terria={this.props.terria}
                                 viewState={this.props.viewState}
                                 searches={this.props.searches}
                   />
                   </div>;
        case this.props.viewState.mobileViewOptions.data:
            return <div className='modal--mobile-bg'>
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
            return <div className='modal--mobile-bg'>
                        <DataPreview terria={this.props.terria}
                                     viewState={this.props.viewState}
                        />
                    </div>;
        case this.props.viewState.mobileViewOptions.nowViewing:
            return <div className='modal--mobile-bg'>
                        <NowViewingContainer viewState={this.props.viewState}
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
        return <div className={classNames('modal--mobile', {'is-open' : this.props.viewState.modalVisible && this.props.viewState.mobileView})}>
                    {this.renderModalContent()}
                    {(this.props.viewState.modalVisible && this.props.viewState.mobileView) && <button className='btn mobile__clear btn--mobile-clear' onClick={this.onClearMobileUI}>Done</button>}
                </div>;
    }
});
module.exports = MobileModalWindow;
