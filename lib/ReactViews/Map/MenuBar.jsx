import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';

import SettingPanel from './Panels/SettingPanel.jsx';
import SharePanel from './Panels/SharePanel/SharePanel.jsx';
import ToolsPanel from './Panels/ToolsPanel/ToolsPanel.jsx';

import FullScreenButton from './Navigation/FullScreenButton.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './menu-bar.scss';

// The map navigation region
const MenuBar = createReactClass({
    displayName: 'MenuBar',
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired,
        allBaseMaps: PropTypes.array,
        menuItems: PropTypes.arrayOf(PropTypes.element)
    },

    getDefaultProps() {
        return {
            menuItems: []
        };
    },

    render() {
        return (
            <div className={Styles.menuArea}>
                <ul className={Styles.menu}>
                    <li className={Styles.menuItem}>
                        <FullScreenButton terria={this.props.terria} viewState={this.props.viewState}/>
                    </li>
                    <li className={Styles.menuItem}>
                        <SettingPanel terria={this.props.terria}
                                      allBaseMaps={this.props.allBaseMaps}
                                      viewState={this.props.viewState}/>
                    </li>
                    <li className={Styles.menuItem}>
                        <SharePanel terria={this.props.terria}
                                    viewState={this.props.viewState}/>
                    </li>
                    {+this.props.terria.userProperties.tools === 1  && <li className={Styles.menuItem}>
                        <ToolsPanel terria={this.props.terria}
                                    viewState={this.props.viewState}/>
                    </li>}
                    <If condition={!this.props.viewState.useSmallScreenInterface}>
                        <For each="element" of={this.props.menuItems} index="i">
                            <li className={Styles.menuItem} key={i}>
                                {element}
                            </li>
                        </For>
                    </If>
                </ul>
            </div>
        );
    },
});

export default MenuBar;
