'use strict';

import React from 'react';
import ChartPanel from '../Chart/ChartPanel.jsx';
import DistanceLegend from './DistanceLegend.jsx';
import LocationBar from './LocationBar.jsx';
import Timeline from './Timeline/Timeline.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

const BottomDock = React.createClass({
    mixins: [ObserveModelMixin],

    displayName: 'BottomDock',

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object
    },

    componentDidUpdate() {
        this.onHeightChange();
    },

    onHeightChange() {
        setTimeout(() => this.props.terria.commonViewerProps.shiftDisclaimerPx = document.querySelector('.bottom-dock').offsetHeight, 0);
    },

    render() {
        const terria = this.props.terria;
        return (
            <div className='bottom-dock'>
                <div className='location-distance'>
                    <LocationBar terria={terria}/>
                    <DistanceLegend terria={terria}/>
                </div>
                <ChartPanel terria={terria} onHeightChange={this.onHeightChange} viewState={this.props.viewState}/>
                <If condition={terria.timeSeriesStack.topLayer}>
                    <Timeline terria={terria}/>
                </If>
            </div>
        );
    }
});

module.exports = BottomDock;





