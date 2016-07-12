import React from 'react';
import classNames from 'classnames';

import defined from 'terriajs-cesium/Source/Core/defined';

import Styles from './panel.scss';

const InnerPanel = React.createClass({


    getDefaultProps() {
        return {
            onDismissed: () => {
            }
        };
    },

    getInitialState() {
        return {}
    },

    componentDidMount() {
        window.addEventListener('click', this.close);
        this.setState({
            isOpenCss: true
        });
    },

    componentWillUnmount() {
        window.removeEventListener('click', this.close);
    },

    close(e) {
        // Only close if this wasn't a click on an open/close button.
        if (!this.props.doNotCloseFlag || !e[this.props.doNotCloseFlag]) {
            window.removeEventListener('click', this.close);

            // If we're closing we want to immediately change the css class to cause it to animate shut, then when it's
            // finished actually stop it rendering with isOpen = false
            this.setState({
                isOpenCss: false
            });

            setTimeout(() => {
                this.props.onDismissed();
            }, 200); // TODO: Determine when it stops animating instead of duplicating the 200ms timeout?
        }
    },

    render() {
        return (
            <div className={classNames(
                    Styles.inner,
                    this.props.theme.inner,
                    {[Styles.isOpen]: this.state.isOpenCss},
                    {[Styles.innerIsOnTop]: this.props.onTop}
                 )}
                 ref={this.props.innerRef}
                 onClick={onPanelClicked}
                 style={{
                    left: this.props.dropdownOffset,
                    transformOrigin: this.props.caretOffset && `${this.props.caretOffset} top`
                }}>
                <If condition={defined(this.props.caretOffset)}>
                    <span className={Styles.caret} style={{left: this.props.caretOffset}}/>
                </If>
                <div className={Styles.content}>
                    {this.props.children}
                </div>
            </div>
        );
    }
});

function onPanelClicked(e) {
    e.stopPropagation();
}

export default InnerPanel;
