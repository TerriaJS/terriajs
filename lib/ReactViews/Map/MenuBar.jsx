import React from 'react';

import createReactClass from 'create-react-class';

import PropTypes from 'prop-types';
import classNames from 'classnames';
import SettingPanel from './Panels/SettingPanel.jsx';
import SharePanel from './Panels/SharePanel/SharePanel.jsx';
import ToolsPanel from './Panels/ToolsPanel/ToolsPanel.jsx';
import Icon from "../Icon.jsx";
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
   
    onStoryButtonClick(){
      this.props.viewState.storyBuilderShown = !this.props.viewState.storyBuilderShown; 
    },

    render() {
        const enableTools = this.props.terria.getUserProperty('tools') === '1';
        return (
            <div className={classNames(Styles.menuArea, this.props.viewState.topElement === 'MenuBar' ? 'top-element': '')}
            onClick={this.handleClick}>
                <ul className={Styles.menu}>
                  <If condition = {this.props.viewState.storyEnabled}>
                    <li className={Styles.menuItem}>
                        <button 
                            className={Styles.storyBtn}
                            type='button'
                            onClick={this.onStoryButtonClick}>
                            <Icon glyph={Icon.GLYPHS.story}/>
                            <span>Story</span>
                        </button>
                    </li>
                  </If>
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
