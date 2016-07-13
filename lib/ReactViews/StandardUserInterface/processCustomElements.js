import React from 'react';
import Nav from './customizable/Nav';
import Menu from './customizable/Menu';

const GROUP_ELEMENT_TO_KEY_MAPPING = {
    'menu': Menu,
    'nav': Nav
};

const groupElementKeys = Object.keys(GROUP_ELEMENT_TO_KEY_MAPPING);

export default function processCustomElements(isSmallScreen, customUI) {
    const groupElements = React.Children.toArray(customUI);

    return groupElements.reduce((soFar, groupElement) => {
        const key = findKeyForGroupElement(groupElement);
        soFar[key] = soFar[key].concat(getGroupChildren(isSmallScreen, groupElement));

        return soFar;
    }, buildEmptyAccumulator());
}

function buildEmptyAccumulator() {
    return groupElementKeys.reduce((acc, key) => {
        acc[key] = [];
        return acc;
    }, {});
}

function findKeyForGroupElement(groupElement) {
    return groupElementKeys.find(key => groupElement.type === GROUP_ELEMENT_TO_KEY_MAPPING[key]);
}

function getGroupChildren(isSmallScreen, groupElement) {
    return React.Children.map(groupElement.props.children, child => {
            if (typeof child === 'string') {
                return <span>{child}</span>
            } else if (child.type.propTypes && child.type.propTypes.smallScreen) {
                return React.cloneElement(child, {
                    smallScreen: isSmallScreen
                })
            } else {
                return child;
            }
        }
    );
}
