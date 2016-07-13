import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';
import classNames from 'classnames';
import MobileMenuItem from './MobileMenuItem';
import SettingPanel from '../Map/Panels/SettingPanel.jsx';
import SharePanel from '../Map/Panels/SharePanel/SharePanel.jsx';
import Terria from '../../Models/Terria';

import ViewState from '../../ReactViewModels/ViewState';

import Styles from './mobile-menu.scss';

const MobileMenu = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        menuItems: React.PropTypes.arrayOf(React.PropTypes.element),
        viewState: React.PropTypes.instanceOf(ViewState).isRequired,
        showFeedback: React.PropTypes.bool,
        terria: React.PropTypes.instanceOf(Terria).isRequired,
        allBaseMaps: React.PropTypes.array.isRequired
    },

    getDefaultProps() {
        return {
            menuItems: [],
            showFeedback: false
        };
    },

    toggleMenu() {
        this.props.viewState.mobileMenuVisible = !this.props.viewState.mobileMenuVisible;
    },

    getInitialState() {
        return {};
    },

    onFeedbackFormClick() {
        this.props.viewState.feedbackFormIsVisible = true;
        this.props.viewState.mobileMenuVisible = false;
    },

    hideMenu() {
        this.props.viewState.mobileMenuVisible = false;
    },

    render() {
        // return this.props.viewState.mobileMenuVisible ? (
        return (
            <div>
                <If condition={this.props.viewState.mobileMenuVisible}>
                    <div className={Styles.overlay} onClick={this.toggleMenu}></div>
                </If>
                <div
                    className={classNames(
                        Styles.mobileNav,
                        {[Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible}
                    )}>
                    <div onClick={this.hideMenu}>
                        <SettingPanel terria={this.props.terria}
                                      allBaseMaps={this.props.allBaseMaps}
                                      viewState={this.props.viewState}/>
                    </div>
                    <div onClick={this.hideMenu}>
                        <SharePanel terria={this.props.terria}
                                    viewState={this.props.viewState}/>
                    </div>
                    <For each="menuItem" of={this.props.menuItems}>
                        <div onClick={this.hideMenu} key={menuItem.key}>
                            {menuItem}
                        </div>
                    </For>
                    <If condition={this.props.showFeedback}>
                        <MobileMenuItem onClick={this.onFeedbackFormClick} caption="Give Feedback"/>
                    </If>
                </div>
            </div>
        );
    }
});

export default MobileMenu;
