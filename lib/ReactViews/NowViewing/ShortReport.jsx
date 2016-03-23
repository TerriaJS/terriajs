'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    renderReports() {
        const sections = this.props.nowViewingItem.shortReportSections;
        if(sections && sections.length > 0) {
            return this.props.nowViewingItem.shortReportSections.map((r, i )=>
                    <div key={i}>
                        <button className='btn'>{r.name}</button>
                        <div dangerouslySetInnerHTML={{__html: r.content}} />
                    </div>
                );
        }
        return null;
    },

    render() {
        return (
            <div className="now-viewing__item__short-report">
                {this.renderReports()}
            </div>
        );
    }
});
module.exports = ShortReport;
