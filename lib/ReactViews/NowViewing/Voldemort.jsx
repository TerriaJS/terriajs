'use strict';

import ObserveModelMixin from './../ObserveModelMixin';
import React from 'react';

const Voldemort = React.createClass({
    mixins: [ObserveModelMixin],

    propTypes: {
        nowViewingItem: React.PropTypes.object
    },

    toggleOpen(item) {
        item.isOpen = !item.isOpen;
    },

    toggleActive(item) {
        item.isActive = !item.isActive;
    },

    renderVoldemortChildren(item, key) {
        let toggleButton = null;
        let selectButton = null;
        const classNames = 'voldemort__children ' + (item.isOpen ? 'is-open' : '');

        if(item.hasChildren) {
            toggleButton = <button onClick={this.toggleOpen.bind(this, item)} className={'btn btn--toggle ' + (item.isOpen ? 'is-open' : '')}></button>;
        }
        if(item.isSelectable) {
            selectButton = <button onClick={this.toggleActive.bind(this, item)} className={'btn ' + (item.isActive ? 'btn--increase' : 'btn--decrease')}></button>;
        }

        if(item.hasChildren) {
            return (<li className={classNames}
                        key={key}>
                        {selectButton}
                        {item.name}
                        {toggleButton}
                        <ul className>
                            {item.items.map((child, i)=>
                                this.renderVoldemortChildren(child, i)
                            )}
                        </ul>
                    </li>);
        }
        return <li className={classNames}
                   key={key}>
                   {selectButton}
                   {item.name}
                   {toggleButton}
               </li>;
    },

    renderVoldemort() {
        const nowViewingItem = this.props.nowViewingItem;
        let content;

        if(nowViewingItem.concepts && nowViewingItem.concepts.length > 0) {
            content = nowViewingItem.concepts.map((item, i)=>{
                if(item.name && item.isVisible) {
                    return this.renderVoldemortChildren(item, i);
                }
            });
        } else {
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
