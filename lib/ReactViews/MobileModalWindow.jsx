'use strict';
import React from 'react';
import SearchBox from './Search/SearchBox.jsx';
import ObserveModelMixin from './ObserveModelMixin';
import DataCatalogTab from './DataCatalogTab.jsx';
import DataPreview from './DataPreview.jsx';
import NowViewingContainer from './NowViewing/NowViewingContainer.jsx';

import classNames from 'classnames';


const MobileModalWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object
    },

    renderModalContent() {
        switch(this.props.viewState.mobileView) {
        case 'search':
            return 'search';
        case 'data':
            return <div className='modal--mobile-bg'>
                        <DataCatalogTab terria={this.props.terria}
                                        viewState={this.props.viewState}
                    />
                    </div>;
        case 'preview':
            return <div className='modal--mobile-bg'>
                        <DataPreview terria={this.props.terria}
                                     viewState={this.props.viewState}
                    />
                    </div>;
        case 'nowViewing':
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
        if(this.props.terria.nowViewing.items.length === 0) {
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
