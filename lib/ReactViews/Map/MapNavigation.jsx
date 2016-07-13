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
        terria: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired,
        navItems: React.PropTypes.arrayOf(React.PropTypes.element)
    },

    getDefaultProps() {
        return {
            navItems: []
        };
    },

    render() {
        return (
            <div className={Styles.mapNavigation}>
                <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
                    <div className={Styles.control}>
                        <Compass terria={this.props.terria}/>
                    </div>
                </If>
                <div className={Styles.control}>
                    <ZoomControl terria={this.props.terria}/>
                </div>
                <div className={Styles.control}>
                    <MyLocation terria={this.props.terria}/>
                </div>
                <For each="item" of={this.props.navItems}>
                    <div className={Styles.control}>
                        {item}
                    </div>
                </For>
            </div>
        );
    }
});

export default MapNavigation;
