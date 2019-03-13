import Compass from './Navigation/Compass';
import createReactClass from 'create-react-class';
// import MyLocation from './Navigation/MyLocation';
import ObserveModelMixin from '../ObserveModelMixin';
import PropTypes from 'prop-types';
import React from 'react';
import { Medium } from '../Generic/Responsive';
import Styles from './map-navigation.scss';
import ToggleSplitterTool from './Navigation/ToggleSplitterTool';
import ViewerMode from '../../Models/ViewerMode';
import ZoomControl from './Navigation/ZoomControl';

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
              <Medium>
                <div className={Styles.navs}>
                  <If condition={this.props.terria.viewerMode !== ViewerMode.Leaflet}>
                      <div className={Styles.control}>
                          <Compass terria={this.props.terria}/>
                      </div>
                  </If>
                  <div className={Styles.control}>
                      <ZoomControl terria={this.props.terria}/>
                  </div>
                </div>
              </Medium>
              <div className={Styles.controls}>
                {/* <If condition={!this.props.terria.configParameters.disableMyLocation}>
                    <div className={Styles.control}>
                        <MyLocation terria={this.props.terria}/>
                    </div>
                </If> */}
                <If condition={!this.props.terria.configParameters.disableSplitter}>
                    <div className={Styles.control}>
                        <ToggleSplitterTool terria={this.props.terria}/>
                    </div>
                </If>
                <For each="item" of={this.props.navItems} index="i">
                    <div className={Styles.control} key={i}>
                        {item}
                    </div>
                </For>
              </div>
            </div>
        );
    },
});

export default MapNavigation;
