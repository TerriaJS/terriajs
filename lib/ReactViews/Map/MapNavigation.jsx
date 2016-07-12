import React from 'react';

import Compass from './Navigation/Compass.jsx';
import MyLocation from './Navigation/MyLocation.jsx';
import ZoomControl from './Navigation/ZoomControl.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import ViewerMode from '../../Models/ViewerMode';

import Styles from './map-navigation.scss';

// The map navigation region
const MapNavigation = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired
    },

    render() {
        return (
            <div className={Styles.mapNavigation}>
                <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
                    <Compass terria={this.props.terria}/>
                </If>
                <MyLocation terria={this.props.terria}/>
                <ZoomControl terria={this.props.terria}/>
            </div>
        );
    }
});

export default MapNavigation;
