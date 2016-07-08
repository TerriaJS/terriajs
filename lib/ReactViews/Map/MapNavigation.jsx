import React from 'react';

import Compass from './Navigation/Compass.jsx';
import MyLocation from './Navigation/MyLocation.jsx';
import ZoomControl from './Navigation/ZoomControl.jsx';
import SettingPanel from './Panels/SettingPanel.jsx';
import SharePanel from './Panels/SharePanel/SharePanel.jsx';

import FullScreenButton from './Navigation/FullScreenButton.jsx';
import ObserveModelMixin from '../ObserveModelMixin';
import ViewerMode from '../../Models/ViewerMode';

import Styles from './map-navigation.scss';

// The map navigation region
const MapNavigation = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        allBaseMaps: React.PropTypes.array,
        menuItems: React.PropTypes.arrayOf(React.PropTypes.element),
        extraNavElements: React.PropTypes.arrayOf(React.PropTypes.element)
    },

    getDefaultProps() {
        return {
            menuItems: [],
            extraNavElements: []
        };
    },

    render() {
        return (
            <div className={Styles.mapNavigation}>
                <ul className={Styles.menu}>
                    <li className={Styles.menuItem}>
                        <FullScreenButton terria={this.props.terria} viewState={this.props.viewState} />
                    </li>
                    <If condition={!this.props.viewState.useSmallScreenInterface}>
                        <For each="element" of={this.props.menuItems} index="i">
                            <li className={Styles.menuItem} key={i}>
                                {element}
                            </li>
                        </For>
                    </If>
                </ul>
                <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
                    <Compass terria={this.props.terria}/>
                </If>
                <MyLocation terria={this.props.terria}/>
                <ZoomControl terria={this.props.terria}/>
                <If condition={!this.props.viewState.useSmallScreenInterface}>
                    <For each="element" of={this.props.extraNavElements}>
                        {element}
                    </For>
                </If>
            </div>
        );
    }
});

export default MapNavigation;
