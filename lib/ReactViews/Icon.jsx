import React from 'react';
// icon.jsx
const GLYPHS = {
    feedback: require('img/icon-feedback.svg'),
    backToStart: require('img/icon-back-to-start.svg'),
    pause: require('img/icon-pause.svg'),
    play: require('img/icon-play.svg'),
    lineChart: require('img/icon-line-chart.svg'),
    menu: require('img/icon-menu.svg'),
    right: require('img/icon-right.svg'),
    left: require('img/icon-left.svg'),
    bulb: require('img/icon-bulb.svg'),
    checkboxChecked: require('img/icon-checkbox-checked.svg'),
    closed: require('img/icon-closed.svg'),
    search: require('img/icon-search.svg'),
    share: require('img/icon-share.svg'),
    close: require('img/icon-close.svg'),
    add: require('img/icon-add.svg'),
    sphere: require('img/icon-sphere.svg'),
    opened: require('img/icon-opened.svg'),
    location: require('img/icon-location.svg'),
    remove: require('img/icon-remove.svg'),
    refresh: require('img/icon-refresh.svg'),
    decrease: require('img/icon-decrease.svg'),
    increase: require('img/icon-increase.svg'),
    checkboxOff: require('img/icon-checkbox-off.svg'),
    minus: require('img/icon-minus.svg'),
    checkboxOn: require('img/icon-checkbox-on.svg'),
    radioOff: require('img/icon-radio-off.svg'),
    radioOn: require('img/icon-radio-on.svg'),
    link: require('img/icon-link.svg'),
    download: require('img/icon-download.svg'),
    backward: require('img/icon-backward.svg'),
    forward: require('img/icon-forward.svg'),
    loop: require('img/icon-loop.svg'),
    statsBars: require('img/icon-stats-bars.svg'),
    folderOpen: require('img/icon-folder-open.svg'),
    folder: require('img/icon-folder.svg'),
    geolocation: require('img/icon-geolocation.svg')
};

const Icon = React.createClass({
    propTypes: {
        glyph: React.PropTypes.string
    },
    render() {
        let glyph = this.props.glyph;
        return (
            <svg className="icon" dangerouslySetInnerHTML={{__html: '<use xlink:href="' + glyph + '"></use>'}}/>
        );
    }
});

module.exports = Icon;
module.exports.GLYPHS = GLYPHS;

