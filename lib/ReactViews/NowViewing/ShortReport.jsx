'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../Core/renderMarkdownInReact';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    renderShortReport() {
        const report = this.props.nowViewingItem.shortReport;
        if (report) {
            return renderMarkdownInReact(report, this.props.nowViewingItem, null);
        }
        return null;
    },

    renderShortReportSections() {
        const sections = this.props.nowViewingItem.shortReportSections;
        if(sections && sections.length > 0) {
            return this.props.nowViewingItem.shortReportSections.map((r, i)=>
                    <div key={i}>
                        <button className='btn'>{r.name}</button>
                        {renderMarkdownInReact(r.content, this.props.nowViewingItem, null)}
                    </div>
                );
        }
        return null;
    },

    render() {
        return (
            <div className="now-viewing__item__short-report">
                {this.renderShortReport()}
                {this.renderShortReportSections()}
            </div>
        );
    }
});
module.exports = ShortReport;
