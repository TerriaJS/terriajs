'use strict';

import defined from 'terriajs-cesium/Source/Core/defined';

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
        if (parent && parent.allowMultiple) {
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
        const style = {};
        if (defined(item.color)) {
            style.color = item.color;
        }

        // !isVisible => hides this concept and all its children
        if (!item.isVisible) {
            return null;
        }

        // if Visible, calculate class names for buttons
        if (item.hasChildren) {
            toggleButton = (
                <button onClick={this.toggleOpen.bind(this, item)}
                    style={style}
                    className={'btn btn--toggle ' + (item.isOpen ? 'is-open' : '')}
                    title='open voldemort'>
                </button>
            );
        }
        if(item.isSelectable) {
            selectButton = (
                <button onClick={this.toggleActive.bind(this, item)}
                    style={style}
                    className={this.getBtnClass(item, parent) + ' btn'}
                    title='select voldemort'>
                </button>
            );
        }

        // !name but has children=> shows the children, but without the dropdown option
        // !name but has no children=> shows nothing
        if (!item.name) {
            if (item.hasChildren) {
                return (
                  <li className={classNames}
                    style={style}
                    key={key}>
                    <ul>
                        {item.items.map((child, i)=>
                            this.renderVoldemortChildren(child, i, item)
                        )}
                      </ul>
                  </li>
                );
            }
            return null;
        }

        // both visible and has name
        // - has children, show dropdown options and children
        if (item.hasChildren) {
            return (
                <li className={classNames}
                    style={style}
                    key={key}>
                    <span className='voldemort__children__header'>{toggleButton}{selectButton}{item.name}</span>
                    <ul>
                        {item.items.map((child, i)=>
                            this.renderVoldemortChildren(child, i, item)
                        )}
                    </ul>
                </li>
            );
        }
        // - no children, show only title and select options
        return (
            <li className={classNames} key={key}>
                <span className='voldemort__children__header'>{toggleButton}{selectButton}{item.name}</span>
            </li>
        );

    },

    renderVoldemort() {
        const nowViewingItem = this.props.nowViewingItem;
        let content;

        if(nowViewingItem.concepts && nowViewingItem.concepts.length > 0) {
            content = nowViewingItem.concepts.map((item, i)=>
                   <div className='voldemort__inner' key="voldemort">
                     <ul>{this.renderVoldemortChildren(item, i)}</ul>
                   </div>
            );
        } else {
            content = null;
        }
        return content;
    },

    render() {
        return (
            <div className='now-viewing__item__voldemort'>
                {this.renderVoldemort()}
            </div>
        );
    }
});
module.exports = Voldemort;
