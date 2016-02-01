'use strict';
const React = require('react');
// The share panel doesn't do anything yet
const SharePanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState() {
        return {
            isOpen: false
        };
    },

    componentWillMount() {},

    togglePanel() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    selectUrl() {},

    render() {
        // To do : aria-hidden={!this.state.isOpen}
        return (
            <div className ={'map-nav-panel setting-panel share-panel ' + (this.state.isOpen ? 'is-open' : '')}>
                <button onClick={this.togglePanel} className='share-panel__button btn btn-map' title='share'><i className="icon icon-share"></i> Share </button>
            </div>
            );
    }
});
module.exports = SharePanel;
