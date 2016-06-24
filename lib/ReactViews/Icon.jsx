import React from 'react';
// icon.jsx
const GLYPHS = {
    test: require('../../wwwroot/images/icons/test.svg')
    // add: require('img/icon-add.svg'),
    // backToStart: require('img/icon-back-to-start.svg'),
    // backward: require('img/icon-backward.svg'),
    // bulb: require('img/icon-bulb.svg'),
    // checkboxChecked: require('img/icon-checkbox-checked.svg'),
    // checkboxOff: require('img/icon-checkbox-off.svg'),
    // checkboxOn: require('img/icon-checkbox-on.svg'),
    // close: require('img/icon-close.svg'),
    // closed: require('img/icon-closed.svg'),
    // decrease: require('img/icon-decrease.svg'),
    // download: require('img/icon-download.svg'),
    // feedback: require('img/icon-feedback.svg'),
    // folder: require('img/icon-folder.svg'),
    // folderOpen: require('img/icon-folder-open.svg'),
    // forward: require('img/icon-forward.svg'),
    // geolocation: require('img/icon-geolocation.svg'),
    // increase: require('img/icon-increase.svg'),
    // left: require('img/icon-left.svg'),
    // lineChart: require('img/icon-line-chart.svg'),
    // link: require('img/icon-link.svg'),
    // location: require('img/icon-location.svg'),
    // loop: require('img/icon-loop.svg'),
    // menu: require('img/icon-menu.svg'),
    // minus: require('img/icon-minus.svg'),
    // opened: require('img/icon-opened.svg'),
    // pause: require('img/icon-pause.svg'),
    // play: require('img/icon-play.svg'),
    // radioOff: require('img/icon-radio-off.svg'),
    // radioOn: require('img/icon-radio-on.svg'),
    // refresh: require('img/icon-refresh.svg'),
    // remove: require('img/icon-remove.svg'),
    // right: require('img/icon-right.svg'),
    // search: require('img/icon-search.svg'),
    // share: require('img/icon-share.svg'),
    // sphere: require('img/icon-sphere.svg'),
    // statsBars: require('img/icon-stats-bars.svg'),
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

