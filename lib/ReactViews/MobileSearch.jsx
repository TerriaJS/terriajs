'use strict';
const React = require('react');

// A Location item when doing Bing map searvh or Gazetter search
const MobileSearch = React.createClass({
    propTypes: {
        viewState: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    render() {
        return (
            <div className="search--mobile">
                mobile search
            </div>
        );
    }
});

module.exports = MobileSearch;
