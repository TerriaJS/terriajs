import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';
import classNames from 'classnames';
import SettingPanel from './Panels/SettingPanel';
import SharePanel from './Panels/SharePanel/SharePanel';
import ToolsPanel from './Panels/ToolsPanel/ToolsPanel';

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

    handleClick() {
        this.props.viewState.topElement = 'MenuBar';
    },

    render() {
        const enableTools = this.props.terria.getUserProperty('tools') === '1';
        return (
            <div className={classNames(Styles.menuArea, this.props.viewState.topElement === 'MenuBar' ? 'top-element': '')}
            onClick={this.handleClick}>
                <ul className={Styles.menu}>
                    <li className={Styles.menuItem}>
                        <SettingPanel
                            terria={this.props.terria}
                            allBaseMaps={this.props.allBaseMaps}
                            viewState={this.props.viewState}
                        />
                    </li>
                    <li className={Styles.menuItem}>
                        <SharePanel terria={this.props.terria}
                                    viewState={this.props.viewState}/>
                    </li>
                    {enableTools && <li className={Styles.menuItem}>
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
    }
});

export default MenuBar;
