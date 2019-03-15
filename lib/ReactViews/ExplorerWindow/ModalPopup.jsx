import classNames from 'classnames';
import createReactClass from 'create-react-class';
import ObserveModelMixin from '../ObserveModelMixin';
import PropTypes from 'prop-types';
import React from 'react';
import Styles from './explorer-window.scss';

const SLIDE_DURATION = 300;

const ModalPopup = createReactClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        isVisible: PropTypes.bool.isRequired,
        onClose: PropTypes.func.isRequired,
        onStartAnimatingIn: PropTypes.func,
        onDoneAnimatingIn: PropTypes.func,
        children: PropTypes.node.isRequired,
        isTopElement: PropTypes.bool
    },

    getInitialState() {
        return {
            isMounted: false,
            visible: undefined
        };
    },

    componentWillMount() {
        this.onVisibilityChange(this.props.isVisible);
    },

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.isVisible !== this.props.isVisible) {
            this.onVisibilityChange(this.props.isVisible);
        }
    },

    componentDidMount() {
        this.escKeyListener = e => {
            if (e.keyCode === 27) {
                this.props.onClose();
            }
        };
        window.addEventListener('keydown', this.escKeyListener, true);
    },

    onVisibilityChange(isVisible) {
        if (isVisible) {
            this.slideIn();
        } else {
            this.slideOut();
        }
    },

    slideIn() {
        if (this.props.onStartAnimatingIn) {
            this.props.onStartAnimatingIn();
        }

        this.setState({
            visible: true
        });
        setTimeout(() => {
            this.setState({
                slidIn: true
            });

            setTimeout(() => {
                if (this.props.onDoneAnimatingIn) {
                    this.props.onDoneAnimatingIn();
                }
            }, SLIDE_DURATION);
        });
    },

    slideOut() {
        this.setState({
            slidIn: false
        });
        setTimeout(() => {
            this.setState({
                visible: false
            });
        }, SLIDE_DURATION);
    },

    componentWillUnmount() {
        window.removeEventListener('keydown', this.escKeyListener, false);
    },

    render() {
        const visible = this.state.visible;

        return visible ? (
            <div className={classNames(Styles.modalWrapper, this.props.isTopElement ? 'top-element': '')}
                 id="explorer-panel-wrapper"
                 aria-hidden={!visible}>
                <div onClick={this.props.onClose}
                     id="modal-overlay"
                     className={Styles.modalOverlay}
                     tabIndex="-1"/>
                <div id="explorer-panel"
                     className={classNames(Styles.explorerPanel, Styles.modalContent, {[Styles.isMounted]: this.state.slidIn})}
                     aria-labelledby="modalTitle"
                     aria-describedby="modalDescription"
                     role="dialog">
                    <button type='button'
                            onClick={this.props.onClose}
                            className={Styles.btnCloseModal}
                            title="Close data panel"
                            data-target="close-modal">
                        Done
                    </button>
                    {this.props.children}
                </div>
            </div>
        ) : null;
    }
});

module.exports = ModalPopup;
