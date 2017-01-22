'use strict';

import React from 'react';
import ObserveModelMixin from '../ObserveModelMixin';
import defined from 'terriajs-cesium/Source/Core/defined';
import classNames from 'classnames';
import MenuPanel from '../StandardUserInterface/customizable/MenuPanel.jsx';

import Styles from './help-panel.scss';
import DropdownStyles from '../Map/Panels/panel.scss';
import helpIcon from '../../../wwwroot/images/icons/help.svg';

const HelpPanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        viewState: React.PropTypes.object.isRequired,
        helpSequences: React.PropTypes.object
    },

    getInitialState() {
        return {
            isOpen: false,
            screens: undefined,
            index: undefined,
            currentRectangle: undefined,
            previousRectangle: undefined,
            setIntervalId: undefined
        };
    },

    onOpenChanged(open) {
        this.setState({
            isOpen: open
        });
    },

    cancel() {
        clearInterval(this.state.setIntervalId);
        this.props.helpSequences.currentScreen = undefined;
        this.setState({
            screens: undefined,
            index: undefined,
            currentRectangle: undefined,
            previousRectangle: undefined
        });
    },

    help(screens, i) {
        if (i === 0) {
            // If this is the first help screen in a sequence, locate the highlighted element and track the rectangle
            // to make sure the overlay and help screen move with the element.
            const that = this;
            const setIntervalId = setInterval(function() {
                if (!defined(that.state.screens)) {
                    return;
                }
                if (that.props.helpSequences.cancel) {
                    // Has been cancelled from somewhere else. Abort!
                    that.cancel();
                }
                const i = that.state.index;
                const currentScreen = that.state && that.state.screens && that.state.screens[i];
                if (currentScreen && typeof currentScreen.preDisplayHook === 'function') {
                    currentScreen.preDisplayHook(that.props.viewState);
                }
                updateCurrentRectangle(that, currentScreen);

                if (!that.props.helpSequences.advance && defined(that.state) && defined(that.state.previousRectangle) && that.state.previousRectangle === that.state.currentRectangle) {
                    return;
                }

                if (defined(that.state) && defined(that.state.currentRectangle)) {
                    currentScreen.rectangle = that.state.currentRectangle;
                    currentScreen.currentScreenNumber = i+1;
                    currentScreen.totalNumberOfScreens = that.state.screens.length;
                    currentScreen.onNext = function() {
                        if (typeof currentScreen.postDisplayHook === 'function') {
                            currentScreen.postDisplayHook(that.props.viewState);
                        }
                        if ((i+1) >= that.state.screens.length) {
                            that.cancel();
                        } else {
                            that.help(that.state.screens, i+1);
                        }
                    };
                    that.props.helpSequences.currentScreen = currentScreen;
                    // Processed current rectangle, set as previous.
                    that.setState({previousRectangle: that.state.currentRectangle});
                }

                if (that.props.helpSequences.advance) {
                    // Has been manually advanced from somewhere else. Next screen!
                    that.props.helpSequences.advance = false;
                    currentScreen.onNext();
                }
            }, 10);
            this.setState({
                setIntervalId: setIntervalId
            });
        }
        this.props.helpSequences.cancel = false;
        this.setState({
            screens: screens,
            index: i,
            currentRectangle: undefined,
            previousRectangle: undefined
        });
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
                       forceClosed={defined(this.props.helpSequences.currentScreen)}
                       smallScreen={this.props.viewState.useSmallScreenInterface}>
                <If condition={this.state.isOpen}>
                    <div className={classNames(Styles.viewer, DropdownStyles.section)}>
                        <label className={DropdownStyles.heading}>{this.props.helpSequences.menuTitle}</label>
                        <ul className={Styles.viewerSelector}>
                            <For each="sequence" index="i" of={this.props.helpSequences.sequences}>
                                <li key={i} className={Styles.listItem}>
                                    <button onClick={this.help.bind(this, {sequence}.sequence.screens, 0)}
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

/**
* Reset currentRectangle to the bounding rectangle of the highlighted element.
* @private
*/
function updateCurrentRectangle(component, currentScreen) {
    if (!defined(currentScreen)) {
        return;
    }
    const highlightedElement = document.getElementsByClassName(currentScreen.highlightedComponentId);
    if (defined(highlightedElement[0])) {
        const screenRect = highlightedElement[0].getBoundingClientRect();
        component.setState({currentRectangle: screenRect});
    }
}

export default HelpPanel;
