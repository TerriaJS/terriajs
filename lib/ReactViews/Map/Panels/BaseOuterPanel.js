import PropTypes from 'prop-types';

export default {
    propTypes: {
        theme: PropTypes.object,
        children: PropTypes.any,
        btnTitle: PropTypes.string,
        btnText: PropTypes.string,
        onOpenChanged: PropTypes.func,
        forceClosed: PropTypes.bool
    },

    getDefaultProps() {
        return {
            theme: {},
            onOpenChanged: () => {
            }
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    onDismissed() {
        this.setState({
            isOpen: false
        });

        this.props.onOpenChanged(false);
    },

    openPanel(e) {
        if (!this.state.isOpen) {
            // Tag this event so that we know not to react to it when it hits the window.
            // We could just set stopPropagation on it, but this would mean that clicks on other buttons that stopPropagation
            // would cause the panel not to close.
            e.nativeEvent[this.getDoNotCloseFlag()] = true;

            this.setState({
                isOpen: true
            });

            this.props.onOpenChanged(true);
        }
    },

    getDoNotCloseFlag() {
        return `do-not-react-${this.props.btnText}-${this.props.btnTitle}-${this.props.theme.btn}`;
    }
};
