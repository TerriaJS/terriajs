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
        item.toggleActive();
    },

    getBtnClass(item, parent) {
        let btnClasses;
        if(parent && parent.allowMultiple) {
            btnClasses = item.isActive ? 'btn--voldemort-multiple-active' : 'btn--voldemort-multiple-inactive';
        } else {
            btnClasses = item.isActive ? 'btn--voldemort-unique-active' : 'btn--voldemort-unique-inactive';
        }
        return btnClasses;
    },

    renderVoldemortChildren(item, key, parent) {
        let toggleButton = null;
        let selectButton = null;
        const classNames = 'voldemort__children ' + (item.isOpen ? 'is-open' : '') + ' ' + (item.hasChildren ? 'has-children' : '');

        if(item.hasChildren) {
            toggleButton = <button onClick={this.toggleOpen.bind(this, item)}
                                   className={'btn btn--toggle ' + (item.isOpen ? 'is-open' : '')}
                                   title='open voldemort'></button>;
        }
        if(item.isSelectable) {
            selectButton = <button onClick={this.toggleActive.bind(this, item)}
                                   className={this.getBtnClass(item, parent) + ' btn'}
                                   title='select voldemort'></button>;
        }

        if(item.hasChildren) {
            return (<li className={classNames}
                        key={key}>
                        <span className='voldemort__children__header'>{toggleButton}{selectButton}{item.name}</span>
                        <ul>
                            {item.items.map((child, i)=>
                                this.renderVoldemortChildren(child, i, item)
                            )}
                        </ul>
                    </li>);
        }
        return <li className={classNames}key={key}>
                  <span className='voldemort__children__header'>{toggleButton}{selectButton}{item.name}</span>
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
            content = null;
        }
        return content;
    },

    render() {
        return (<div className='voldemort'>
                  <div className='voldemort__inner'>
                    <ul>{this.renderVoldemort()}</ul>
                  </div>
                </div>);
    }
});
module.exports = Voldemort;
