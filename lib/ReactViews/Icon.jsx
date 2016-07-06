import React from 'react';
import classNames from 'classnames';

// icon.jsx
const GLYPHS = {
    add: require('../../wwwroot/images/icons/add.svg'),
    backToStart: require('../../wwwroot/images/icons/back-to-start.svg'),
    backward: require('../../wwwroot/images/icons/backward.svg'),
    barChart: require('../../wwwroot/images/icons/bar-chart.svg'),
    bulb: require('../../wwwroot/images/icons/bulb.svg'),
    checkboxOff: require('../../wwwroot/images/icons/checkbox-off.svg'),
    checkboxOn: require('../../wwwroot/images/icons/checkbox-on.svg'),
    close: require('../../wwwroot/images/icons/close.svg'),
    closed: require('../../wwwroot/images/icons/closed.svg'),
    decrease: require('../../wwwroot/images/icons/decrease.svg'),
    download: require('../../wwwroot/images/icons/download.svg'),
    expand: require('../../wwwroot/images/icons/expand.svg'),
    eye: require('../../wwwroot/images/icons/eye.svg'),
    feedback: require('../../wwwroot/images/icons/feedback.svg'),
    folder: require('../../wwwroot/images/icons/folder.svg'),
    folderOpen: require('../../wwwroot/images/icons/folder-open.svg'),
    forward: require('../../wwwroot/images/icons/forward.svg'),
    geolocation: require('../../wwwroot/images/icons/geolocation.svg'),
    increase: require('../../wwwroot/images/icons/increase.svg'),
    left: require('../../wwwroot/images/icons/left.svg'),
    lineChart: require('../../wwwroot/images/icons/line-chart.svg'),
    link: require('../../wwwroot/images/icons/link.svg'),
    loader: require('../../wwwroot/images/icons/loader.svg'),
    location: require('../../wwwroot/images/icons/location.svg'),
    loop: require('../../wwwroot/images/icons/loop.svg'),
    menu: require('../../wwwroot/images/icons/menu.svg'),
    opened: require('../../wwwroot/images/icons/opened.svg'),
    pause: require('../../wwwroot/images/icons/pause.svg'),
    play: require('../../wwwroot/images/icons/play.svg'),
    radioOff: require('../../wwwroot/images/icons/radio-off.svg'),
    radioOn: require('../../wwwroot/images/icons/radio-on.svg'),
    refresh: require('../../wwwroot/images/icons/refresh.svg'),
    remove: require('../../wwwroot/images/icons/remove.svg'),
    right: require('../../wwwroot/images/icons/right.svg'),
    search: require('../../wwwroot/images/icons/search.svg'),
    selected: require('../../wwwroot/images/icons/selected.svg'),
    share: require('../../wwwroot/images/icons/share.svg'),
    showLess: require('../../wwwroot/images/icons/show-less.svg'),
    showMore: require('../../wwwroot/images/icons/show-more.svg'),
    sphere: require('../../wwwroot/images/icons/sphere.svg'),
};

const Icon = React.createClass({
    propTypes: {
        glyph: React.PropTypes.string,
        style: React.PropTypes.object,
        className: React.PropTypes.string
    },
    render() {
        const glyph = this.props.glyph;
        return (
            <svg viewBox="0 0 100 100" className={classNames('icon', this.props.className)} style={this.props.style} dangerouslySetInnerHTML={{__html: '<use xlink:href="' + glyph + '"></use>'}}/>
        );
    }
});

module.exports = Icon;
module.exports.GLYPHS = GLYPHS;

