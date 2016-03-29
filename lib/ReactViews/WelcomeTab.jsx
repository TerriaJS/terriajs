'use strict';
import React from 'react';
import renderMarkdownInReact from '../Core/renderMarkdownInReact';
// The welcome tab, not used in current design
const WelcomeTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    render() {
        return (<div>
                    <div className="panel-content">{renderMarkdownInReact(this.props.terria.welcome)}</div>
                </div>);
    }
});
module.exports = WelcomeTab;
