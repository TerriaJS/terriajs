import React from 'react';
// icon.jsx
const GLYPHS = {
    test: require('../../wwwroot/images/icons/test.svg'),
    add: require('../../wwwroot/images/icons/add.svg'),
    expand: require('../../wwwroot/images/icons/expand.svg'),
    backToStart: require('../../wwwroot/images/icons/back-to-start.svg'),
    backward: require('../../wwwroot/images/icons/backward.svg'),
    bulb: require('../../wwwroot/images/icons/bulb.svg'),
    checkboxChecked: require('../../wwwroot/images/icons/checkbox-checked.svg'),
    checkboxOff: require('../../wwwroot/images/icons/checkbox-off.svg'),
    checkboxOn: require('../../wwwroot/images/icons/checkbox-on.svg'),
    close: require('../../wwwroot/images/icons/close.svg'),
    closed: require('../../wwwroot/images/icons/closed.svg'),
    decrease: require('../../wwwroot/images/icons/decrease.svg'),
    download: require('../../wwwroot/images/icons/download.svg'),
    feedback: require('../../wwwroot/images/icons/feedback.svg'),
    folder: require('../../wwwroot/images/icons/folder.svg'),
    folderOpen: require('../../wwwroot/images/icons/folder-open.svg'),
    forward: require('../../wwwroot/images/icons/forward.svg'),
    geolocation: require('../../wwwroot/images/icons/geolocation.svg'),
    increase: require('../../wwwroot/images/icons/increase.svg'),
    left: require('../../wwwroot/images/icons/left.svg'),
    lineChart: require('../../wwwroot/images/icons/line-chart.svg'),
    link: require('../../wwwroot/images/icons/link.svg'),
    location: require('../../wwwroot/images/icons/location.svg'),
    // loop: require('../../wwwroot/images/icons/loop.svg'),
    menu: require('../../wwwroot/images/icons/menu.svg'),
    // minus: require('../../wwwroot/images/icons/minus.svg'),
    opened: require('../../wwwroot/images/icons/opened.svg'),
    pause: require('../../wwwroot/images/icons/pause.svg'),
    play: require('../../wwwroot/images/icons/play.svg'),
    radioOff: require('../../wwwroot/images/icons/radio-off.svg'),
    radioOn: require('../../wwwroot/images/icons/radio-on.svg'),
    refresh: require('../../wwwroot/images/icons/refresh.svg'),
    remove: require('../../wwwroot/images/icons/remove.svg'),
    right: require('../../wwwroot/images/icons/right.svg'),
    search: require('../../wwwroot/images/icons/search.svg'),
    share: require('../../wwwroot/images/icons/share.svg'),
    sphere: require('../../wwwroot/images/icons/sphere.svg'),
    loader: require('../../wwwroot/images/icons/loader.svg'),
    barChart: require('../../wwwroot/images/icons/bar-chart.svg')
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

