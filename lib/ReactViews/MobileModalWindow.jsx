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
        console.log(this.props.viewState);
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
            return <NowViewingContainer viewState={this.props.viewState}
                                        terria={this.props.terria}
                    />;
        default:
            return null;
        }
    },

    render() {

        return <div className={classNames('modal--mobile', {'is-open' : this.props.viewState.modalVisible})}>
                    {this.renderModalContent()}
                </div>;
    }
});
module.exports = MobileModalWindow;
