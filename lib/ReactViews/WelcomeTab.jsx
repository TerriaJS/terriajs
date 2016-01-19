'use strict';
var React = require('react');
// The welcome tab, not used in current design
var WelcomeTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    render: function() {
        return <div className="panel-content" dangerouslySetInnerHTML={this.props.terria.welcome()}></div>;
    }
});
module.exports = WelcomeTab;
