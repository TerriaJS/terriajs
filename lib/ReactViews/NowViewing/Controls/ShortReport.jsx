'use strict';

import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../../Core/renderMarkdownInReact';
import Styles from './short-report.scss';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    render() {
        return (
            <div className={Styles.shortReport}>
                <If condition={this.props.nowViewingItem.shortReport}>
                    {renderMarkdownInReact(this.props.nowViewingItem.shortReport, this.props.nowViewingItem, null)}
                </If>
                <If condition={this.props.nowViewingItem.shortReportSections}>
                    <For each="r" of={this.props.nowViewingItem.shortReportSections} index="i">
                        <div key={i}>
                            <label>{r.name}</label>
                            {renderMarkdownInReact(r.content, this.props.nowViewingItem, null)}
                        </div>
                    </For>
                </If>
            </div>
        );
    }
});

module.exports = ShortReport;
