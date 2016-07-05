import React from 'react';
import classNames from 'classnames';

import MobileMenuItem from '../../Mobile/MobileMenuItem';

const MobilePanel = React.createClass({
    propTypes: {
        // theme: React.PropTypes.object.isRequired,
        children: React.PropTypes.any,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string,
        onOpenChanged: React.PropTypes.func,
        viewState: React.PropTypes.object
    },

    getDefaultProps() {
        return {
            onOpenChanged: () => {
            }
        };
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    render() {
        return (
            <MobileMenuItem onClick={this.togglePanel} caption={this.props.btnText}/>
        );

        // return (
        //     <div className={classNames({[Styles.isOpen]: this.state.isOpenCss}, Styles.panel, this.props.theme.outer)}>
        //         <button onClick={this.togglePanel}
        //                 type='button'
        //                 className={classNames(Styles.button, this.props.theme.btn)}
        //                 title={this.props.btnTitle}
        //                 ref={element => this.buttonElement = element}>
        //             <If condition={this.props.theme.icon}>
        //                 <Icon glyph={Icon.GLYPHS[this.props.theme.icon]}/>
        //             </If>
        //             {this.props.btnText}
        //         </button>
        //         <If condition={this.state.isOpen}>
        //             <div className={classNames(
        //                     Styles.inner,
        //                     this.props.theme.inner,
        //                     {[Styles.innerIsOnTop]: this.props.viewState.componentOnTop === this.props.viewState.componentOrderOptions.dropdownPanel}
        //                  )}
        //                  onClick={this.onPanelClicked}
        //                  ref={this.onInnerMounted}
        //                  style={{
        //                      left: this.state.dropdownOffset,
        //                      transformOrigin: `${this.state.caretOffset} top`
        //                  }}>
        //                 <If condition={defined(this.state.caretOffset)}>
        //                     <span className={Styles.caret}
        //                           style={{left: this.state.caretOffset}}/>
        //                 </If>
        //                 <div className={Styles.content}>
        //                     {this.props.children}
        //                 </div>
        //             </div>
        //         </If>
        //     </div>
        // );
    }
});

export default MobilePanel;
