import React from 'react';

import MobileMenuItem from '../../Mobile/MobileMenuItem';
import ObserveModelMixin from '../../ObserveModelMixin';
import BaseOuterPanel from './BaseOuterPanel';
import InnerPanel from './InnerPanel';

import Styles from './panel.scss';

const MobilePanel = React.createClass({
    mixins: [ObserveModelMixin, BaseOuterPanel],

    propTypes: {
        theme: React.PropTypes.object.isRequired,
        children: React.PropTypes.any,
        btnTitle: React.PropTypes.string,
        btnText: React.PropTypes.string,
        onOpenChanged: React.PropTypes.func,
        viewState: React.PropTypes.object
    },

    render() {
        return (
            <div>
                <MobileMenuItem onClick={this.openPanel} caption={this.props.btnText}/>
                <If condition={this.state.isOpen}>
                    {/* The overlay doesn't actually need to do anything except block clicks, as InnerPanel will listen to the window */}
                    <div className={Styles.overlay}/>
                    
                    <InnerPanel theme={this.props.theme}
                                caretOffset="15px"
                                doNotCloseFlag={this.getDoNotCloseFlag()}
                                onDismissed={this.onDismissed}>
                        {this.props.children}
                    </InnerPanel>
                </If>
            </div>
        )
    }
});

export default MobilePanel;
