import React from 'react';
import classNames from 'classnames';

import MobileMenuItem from '../../Mobile/MobileMenuItem';
import ObserveModelMixin from '../../ObserveModelMixin';

import Styles from './mobile-menu-panel.scss';

const MobilePanel = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        theme: React.PropTypes.object.isRequired,
        children: React.PropTypes.any,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string,
        onOpenChanged: React.PropTypes.func,
        viewState: React.PropTypes.object
    },

    getDefaultProps() {
        return {
            onOpenChanged: () => {},
            onClick: () => {}
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    togglePanel() {
        this.setState({
            isOpen: !this.state.isOpen
        });
        this.props.onOpenChanged(!this.state.isOpen);
        this.props.onClick();
    },

    render() {
        return (
            <div>
                <MobileMenuItem onClick={this.togglePanel} caption={this.props.btnText} />
                <If condition={this.state.isOpen}>
                    <div
                        className={classNames(Styles.inner, this.props.theme.inner)}
                        onClick={this.onPanelClicked}>
                        <div className={Styles.content}>
                            {this.props.children}
                        </div>
                    </div>
                </If>
            </div>
        )
    }
});

export default MobilePanel;
