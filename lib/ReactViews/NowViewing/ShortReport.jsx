'use strict';

import CustomComponents from '../../Models/CustomComponents';
import markdownToHtml from '../../Core/markdownToHtml';
import ObserveModelMixin from './../ObserveModelMixin';
import parseCustomHtmlToReact from '../../Models/parseCustomHtmlToReact';
import React from 'react';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    sanitizedCustomMarkdown(content) {
        const html = markdownToHtml(content, false, {
            ADD_TAGS: CustomComponents.names(),
            ADD_ATTR: CustomComponents.attributes()
        });
        return parseCustomHtmlToReact('<div>' + html + '</div>', this.props.catalogItem, this.props.feature);
    },

    renderShortReport() {
        const report = this.props.nowViewingItem.shortReport;
        if (report) {
            return this.sanitizedCustomMarkdown(report);
        }
        return null;
    },

    renderShortReportSections() {
        const sections = this.props.nowViewingItem.shortReportSections;
        if(sections && sections.length > 0) {
            return this.props.nowViewingItem.shortReportSections.map((r, i)=>
                    <div key={i}>
                        <button className='btn'>{r.name}</button>
                        {this.sanitizedCustomMarkdown(r.content)}
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
