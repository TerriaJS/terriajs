'use strict';

import React from 'react';
import ChartPanel from '../Custom/Chart/ChartPanel.jsx';
import Timeline from './Timeline/Timeline.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import Styles from './bottom-dock.scss';

const BottomDock = React.createClass({
    mixins: [ObserveModelMixin],

    displayName: 'BottomDock',

    propTypes: {
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        domElementRef: React.PropTypes.function
    },

    render() {
        const terria = this.props.terria;

        return (
            <div className={Styles.bottomDock} ref={this.props.domElementRef}>
                <ChartPanel terria={terria} onHeightChange={this.onHeightChange} viewState={this.props.viewState}/>
                <If condition={terria.timeSeriesStack.topLayer}>
                    <Timeline terria={terria}/>
                </If>
            </div>
        );
    }
});

module.exports = BottomDock;
