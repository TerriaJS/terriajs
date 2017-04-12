import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import Compass from './Navigation/Compass.jsx';
import MyLocation from './Navigation/MyLocation.jsx';
import ZoomControl from './Navigation/ZoomControl.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import ViewerMode from '../../Models/ViewerMode';

import Styles from './map-navigation.scss';

// The map navigation region
const MapNavigation = createReactClass({
    displayName: 'MapNavigation',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        navItems: PropTypes.arrayOf(PropTypes.element)
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
                <For each="item" of={this.props.navItems} index="i">
                    <div className={Styles.control} key={i}>
                        {item}
                    </div>
                </For>
            </div>
        );
    },
});

export default MapNavigation;
