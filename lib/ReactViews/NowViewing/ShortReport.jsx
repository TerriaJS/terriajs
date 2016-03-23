'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const ShortReport = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object.isRequired
    },

    render() {
        return (
            <div className="now-viewing__item__short-report">
                short report
        </div>
        );
    }
});
module.exports = ShortReport;
