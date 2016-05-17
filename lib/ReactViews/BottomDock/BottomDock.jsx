'use strict';

import React from 'react';
import ChartPanel from '../Chart/ChartPanel.jsx';
import Timeline from './Timeline/Timeline.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './bottom-dock.scss';

const BottomDock = React.createClass({
    mixins: [ObserveModelMixin],

    displayName: 'BottomDock',

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    render() {
        const terria = this.props.terria;

        return (
            <div className={Styles.bottomDock}>
                <ChartPanel terria={terria} onHeightChange={this.onHeightChange} viewState={this.props.viewState}/>
                <If condition={terria.timeSeriesStack.topLayer}>
                    <Timeline terria={terria}/>
                </If>
            </div>
        );
    }
});

module.exports = BottomDock;
