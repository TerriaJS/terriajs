'use strict';

import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../StandardUserInterface/customizable/MenuPanel.jsx';

import Styles from './help-panel.scss';
import DropdownStyles from '../Map/Panels/panel.scss';
import helpIcon from '../../../wwwroot/images/icons/help.svg';

const HelpMenuPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        helpViewState: React.PropTypes.object.isRequired,
        helpSequences: React.PropTypes.object.isRequired,
        viewState: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    onOpenChanged(open) {
        this.setState({
            isOpen: open
        });
    },

    help(sequence) {
        this.props.helpViewState.currentSequence = sequence;
    },

    render() {
        const dropdownTheme = {
            btn: Styles.btnShare,
            outer: Styles.sharePanel,
            inner: Styles.dropdownInner,
            icon: helpIcon
        };

        return (
            <MenuPanel theme={dropdownTheme}
                       btnText="Help"
                       viewState={this.props.viewState}
                       btnTitle="get help"
                       onOpenChanged={this.onOpenChanged}
                       forceClosed={defined(this.props.helpViewState.currentSequence)}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <If condition={this.state.isOpen}>
                    <div className={classNames(Styles.viewer, DropdownStyles.section)}>
                        <label className={DropdownStyles.heading}>{this.props.helpSequences.menuTitle}</label>
                        <ul className={Styles.viewerSelector}>
                            <For each="sequence" index="i" of={this.props.helpSequences.sequences}>
                                <li key={i} className={Styles.listItem}>
                                    <button onClick={this.help.bind(this, {sequence}.sequence)}
                                            className={Styles.btnViewer}>
                                        {sequence.title}
                                    </button>
                                </li>
                            </For>
                        </ul>
                    </div>
                </If>
            </MenuPanel>
        );
    }
});

export default HelpMenuPanel;
