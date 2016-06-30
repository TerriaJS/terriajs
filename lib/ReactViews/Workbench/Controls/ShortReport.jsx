'use strict';

import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import renderMarkdownInReact from '../../../Core/renderMarkdownInReact';
import Styles from './short-report.scss';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: React.PropTypes.object.isRequired
    },

    render() {
        return (
            <div className={Styles.shortReport}>
                <If condition={this.props.item.shortReport}>
                    {renderMarkdownInReact(this.props.item.shortReport, this.props.item, null)}
                </If>
                <If condition={this.props.item.shortReportSections}>
                    <For each="r" of={this.props.item.shortReportSections} index="i">
                        <div key={i}>
                            <label>{r.name}</label>
                            {renderMarkdownInReact(r.content, this.props.item, null)}
                        </div>
                    </For>
                </If>
            </div>
        );
    }
});

module.exports = ShortReport;
