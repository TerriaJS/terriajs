'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';
import TestingSection from './TestingSection';

import Styles from './tools-panel.scss';
import DropdownStyles from '../panel.scss';
import Icon from "../../../Icon.jsx";

const ToolsPanel = createReactClass({
    displayName: 'ToolsPanel',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        viewState: PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isOpen: false,
        };
    },

    onOpenChanged(open) {
        this.setState({
            isOpen: open
        });
    },

    render() {
        const dropdownTheme = {
            btn: Styles.btnShare,
            outer: Styles.ToolsPanel,
            inner: Styles.dropdownInner,
            icon: 'settings'
        };

        return (
            <MenuPanel theme={dropdownTheme}
                       btnText="Tool"
                       viewState={this.props.viewState}
                       btnTitle="Advanced toolbox"
                       onOpenChanged={this.onOpenChanged}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <If condition={this.state.isOpen}>
                        <div className={DropdownStyles.section}>
                            <div className={Styles.toolsPanel}>
                              <TestingSection terria={this.props.terria} viewState={this.props.viewState}/>
                            </div>
                        </div>
                </If>
            </MenuPanel>
        );
    },
});

export default ToolsPanel;
