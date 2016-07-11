import React from 'react';

import ObserveModelMixin from '../ObserveModelMixin';

import Styles from './mobile-menu.scss';

const MobileMenu = React.createClass({
    mixins: [ObserveModelMixin],

    toggleMenu() {
        this.props.viewState.mobileMenuVisible = !this.props.viewState.mobileMenuVisible;
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
        const visible = this.props.viewState.mobileMenuVisible;

        return (
            <If condition={visible}>
                <div className={Styles.overlay} onClick={this.toggleMenu}>
                    <ul className={Styles.mobileNav}>
                        <For each="menuItem" of={this.props.menuItems} index="i">
                            {React.cloneElement(menuItem, {
                                key: i,
                                onClick: this.toggleMenu
                            })}
                        </For>
                        {/*<li>
                         <a href='' onClick={this.onClickFeedback}>Give feedback</a>
                         </li>*/}
                    </ul>
                </div>
            </If>
        )
    }
});

export default MobileMenu;
