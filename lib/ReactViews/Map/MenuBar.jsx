import React from 'react';

import SettingPanel from './Panels/SettingPanel.jsx';
import SharePanel from './Panels/SharePanel/SharePanel.jsx';

import FullScreenButton from './Navigation/FullScreenButton.jsx';
import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './menu-bar.scss';

// The map navigation region
const MenuBar = React.createClass({
    mixins: [ObserveModelMixin],
    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object.isRequired,
        allBaseMaps: React.PropTypes.array,
        extraMenuElements: React.PropTypes.arrayOf(React.PropTypes.element)
    },

    getDefaultProps() {
        return {
            extraMenuElements: []
        };
    },

    render() {
        return (
            <div className={Styles.menuArea}>
                <ul className={Styles.menu}>
                    <li className={Styles.menuItem}>
                        <FullScreenButton terria={this.props.terria} viewState={this.props.viewState} />
                    </li>
                    <li className={Styles.menuItem}>
                        <SettingPanel terria={this.props.terria} allBaseMaps={this.props.allBaseMaps} viewState={this.props.viewState} />
                    </li>
                    <li className={Styles.menuItem}>
                        <SharePanel terria={this.props.terria} viewState={this.props.viewState}/>
                    </li>
                    <For each="element" of={this.props.extraMenuElements} index="i">
                        <li className={Styles.menuItem} key={i}>
                            {element}
                        </li>
                    </For>
                </ul>
            </div>
        );
    }
});

export default MenuBar;
