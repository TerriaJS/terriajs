'use strict';

import ObserveModelMixin from '../ObserveModelMixin';
import React from 'react';
import parseCustomHtmlToReact from '../Custom/parseCustomHtmlToReact';
import Styles from './help-screen-window.scss';
import classNames from 'classnames';

const HelpScreenWindow = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        terria: React.PropTypes.object,
        viewState: React.PropTypes.object
    },

    render() {
        const helpScreen = this.props.terria.helpScreens && this.props.terria.helpScreens[this.props.terria.helpScreens.length - 1];
        const windowClass = classNames(Styles.window, {
            [Styles.isActive]: helpScreen
        });
        const buttonText = helpScreen && helpScreen.totalNumberOfScreens === helpScreen.currentScreenNumber ? 'DONE' : 'NEXT';
        const positionLeft = helpScreen && helpScreen.left;
        const positionTop = helpScreen && helpScreen.top;

        const caretTop = helpScreen && helpScreen.caret === 'top';
        const caretLeft = helpScreen && helpScreen.caret === 'left';

        return (
            <div style={{left: positionLeft + 'px', top: positionTop + 'px'}} className={windowClass} aria-hidden={ !helpScreen }>
              <span className={classNames(Styles.caret, {[Styles.caretTop]: caretTop, [Styles.caretLeft]: caretLeft})}/>
              <div className={Styles.content}>
                  {helpScreen && parseCustomHtmlToReact(helpScreen.message())}
              </div>
              <div className={Styles.screenCount}>
                  <strong>{helpScreen && helpScreen.currentScreenNumber + '/' + helpScreen.totalNumberOfScreens}</strong>
              </div>
              <div className={Styles.nextButton}>
                  <button type='button' onClick={helpScreen && helpScreen.onNext}
                      className={Styles.btn}><strong>{buttonText}</strong></button>
              </div>
            </div>);
    }
});

module.exports = HelpScreenWindow;
