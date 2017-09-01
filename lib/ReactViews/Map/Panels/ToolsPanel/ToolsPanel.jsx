ToolsPanel'use strict';

import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import ObserverModelMixin from '../../../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../../../StandardUserInterface/customizable/MenuPanel.jsx';

import Styles from './share-panel.scss';
import DropdownStyles from '../panel.scss';
import Icon from "../../../Icon.jsx";

const ToolsPanel = createReactClass({
    displayName: 'ToolsPanel',
    mixins: [ObserverModelMixin],

    propTypes: {
        terria: PropTypes.object,
        userPropWhiteList: PropTypes.array,
        isOpen: PropTypes.bool,
        viewState: PropTypes.object.isRequired
    },

    getDefaultProps() {
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
            icon: 'share'
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
                            <div>advanced toolbox</div>
                        </div>
                </If>
            </MenuPanel>
        );
    },
});

export default ToolsPanel;
