'use strict';
const React = require('react');
// The welcome tab, not used in current design
const WelcomeTab = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    render() {
        return (<div>
            <div className="panel-content" dangerouslySetInnerHTML={this.props.terria.welcome()}/>
            <If condition={true}>
                This is an example of an If
            <Else />
                This won't get shown.
            </If>
        </div>);
    }
});
module.exports = WelcomeTab;
