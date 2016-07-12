import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';
import classNames from 'classnames';

import Styles from './mobile-menu.scss';

const MobileMenu = React.createClass({
    mixins: [ObserveModelMixin],

    toggleMenu() {
        this.props.viewState.mobileMenuVisible = !this.props.viewState.mobileMenuVisible;
    },

    getInitialState() {
        return {};
    },

    getDefaultProps() {
        return {
            menuItems: []
        }
    },

    componentWillMount() {

    },

    componentWillDismount() {

    },

    render() {
        // return this.props.viewState.mobileMenuVisible ? (
        return (
            <div>
                <If condition={this.props.viewState.mobileMenuVisible}>
                    <div className={Styles.overlay} onClick={this.toggleMenu}></div>
                </If>
                <ul className={classNames(Styles.mobileNav, {[Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible})}>
                    <For each="menuItem" of={this.props.menuItems} index="i">
                        <div onClick={() => this.props.viewState.mobileMenuVisible = false}>
                            {menuItem}
                        </div>
                    </For>
                    {/*<li>
                     <a href='' onClick={this.onClickFeedback}>Give feedback</a>
                     </li>*/}
                </ul>
            </div>
        );
    }
});

export default MobileMenu;
