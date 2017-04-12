'use strict';

import ObserveModelMixin from '../../ObserveModelMixin';
import React from 'react';
import PropTypes from 'prop-types';
import parseCustomMarkdownToReact from '../../Custom/parseCustomMarkdownToReact';
import Styles from './short-report.scss';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        item: PropTypes.object.isRequired
    },

    render() {
        return (
            <div className={Styles.shortReport}>
                <If condition={this.props.item.shortReport}>
                    {parseCustomMarkdownToReact(this.props.item.shortReport, {catalogItem: this.props.item})}
                </If>
                <If condition={this.props.item.shortReportSections}>
                    <For each="r" of={this.props.item.shortReportSections} index="i">
                        <div key={i}>
                            <label>{r.name}</label>
                            {parseCustomMarkdownToReact(r.content, {catalogItem: this.props.item})}
                        </div>
                    </For>
                </If>
            </div>
        );
    }
});

module.exports = ShortReport;
