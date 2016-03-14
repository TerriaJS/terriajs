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

    toggleActive(concept) {
        concept.toggleActive();
    },

    getBtnClass(concept, parent) {
        let btnClasses;
        if (parent && parent.allowMultiple) {
            btnClasses = concept.isActive ? 'btn--voldemort-multiple-active' : 'btn--voldemort-multiple-inactive';
        } else {
            btnClasses = concept.isActive ? 'btn--voldemort-unique-active' : 'btn--voldemort-unique-inactive';
        }
        return btnClasses;
    },

    renderVoldemortChildren(concept, key, parent) {
        let selectButton = null;
        const classNames = 'voldemort__children ' + (concept.isOpen ? 'is-open' : '') + ' ' + (concept.hasChildren ? 'has-children' : '');
        const style = {};
        if (defined(concept.color)) {
            style.color = concept.color;
        }

        // !isVisible => hides this concept and all its children
        if (!concept.isVisible) {
            return null;
        }

        if (concept.isSelectable) {
            selectButton = (
                <button onClick={this.toggleActive.bind(this, concept)}
                    style={style}
                    className={this.getBtnClass(concept, parent) + ' btn'}
                    title='select variable'>
                </button>
            );
        }

        // If no children, show only title and select options.
        if (!concept.hasChildren) {
            return (
                <li className={classNames} key={key}>
                    <span className='voldemort__children__header'>{selectButton}{concept.name}</span>
                </li>
            );
        }

        // If no name, show the children without the dropdown option.
        if (!concept.name) {
            return (
              <li className={classNames}
                style={style}
                key={key}>
                <ul>
                    {concept.items.map((child, i)=>
                        this.renderVoldemortChildren(child, i, concept)
                    )}
                  </ul>
              </li>
            );
        }

        // Otherwise show dropdown options and children
        const toggleButton = (
            <button onClick={this.toggleOpen.bind(this, concept)}
                style={style}
                className={'btn btn--toggle ' + (concept.isOpen ? 'is-open' : '')}
                title='open variable selection'>
            </button>
        );
        return (
            <li className={classNames}
                style={style}
                key={key}>
                <span className='voldemort__children__header'>{toggleButton}{selectButton}{concept.name}</span>
                <ul>
                    {concept.items.map((child, i)=>
                        this.renderVoldemortChildren(child, i, concept)
                    )}
                </ul>
            </li>
        );
    },

    renderVoldemort() {
        const nowViewingItem = this.props.nowViewingItem;
        let content;

        if (nowViewingItem.concepts && nowViewingItem.concepts.length > 0) {
            content = nowViewingItem.concepts.map((concept, i)=>
                   <div className='voldemort__inner' key={i}>
                        <ul>{this.renderVoldemortChildren(concept, i)}</ul>
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
