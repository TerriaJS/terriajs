'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const Voldemort = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object,
        terria: React.PropTypes.object
    },

    renderVoldemort() {
        const nowViewingItem = this.props.nowViewingItem;
        let content;

        if(nowViewingItem.concepts && nowViewingItem.concepts.length > 0) {
            content = nowViewingItem.concepts.map((item, i)=>
                <li key={i}> {item.name}</li>);
        }
        else {
          content = <li> empty </li>;
        }


        return content;
    },

    render() {
        return (<div className='voldemort'>
                  <ul>{this.renderVoldemort()}</ul>
                </div>);
    }
});
module.exports = Voldemort;
