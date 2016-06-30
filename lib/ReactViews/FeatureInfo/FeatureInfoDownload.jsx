import React from 'react';
import Dropdown from '../Generic/Dropdown';
import FeatureDetection from 'terriajs-cesium/Source/Core/FeatureDetection';
import Icon from "../Icon.jsx";

import Styles from './feature-info-download.scss';

const FeatureInfoDownload = React.createClass({
    propTypes: {
        data: React.PropTypes.object.isRequired,
        name: React.PropTypes.string.isRequired,
        viewState: React.PropTypes.object.isRequired,
        canUseDataUri: React.PropTypes.bool
    },

    getDefaultProps() {
        return {
            canUseDataUri: !(FeatureDetection.isInternetExplorer() || (/Edge/).exec(navigator.userAgent))
        };
    },

    checkDataUriCompatibility(event) {
        if (!this.props.canUseDataUri) {
            event.preventDefault();

            this.props.viewState.notifications.push({
                title: 'Browser Does Not Support Data Download',
                message: 'Unfortunately Microsoft browsers (including all versions of Internet Explorer and Edge) do not ' +
                'support the data uri functionality needed to download data as a file. To download, copy the following uri ' +
                'into another browser such as Chrome, Firefox or Safari: ' + event.currentTarget.getAttribute('href')
            });
        }
    },

    getLinks() {
        return [
            {
                href: makeDataUri('csv', generateCsvData(this.props.data)),
                download: `${this.props.name}.csv`,
                label: 'CSV'
            },
            {
                href: makeDataUri('json', JSON.stringify(this.props.data)),
                download: `${this.props.name}.json`,
                label: 'JSON'
            }
        ].filter(download => !!download.href);
    },

    render() {
        const links = this.getLinks();

        return (
            <Dropdown options={links}
                      textProperty="label"
                      theme={{dropdown: Styles.download, list: Styles.dropdownList, button: Styles.dropdownButton}}
                      buttonClassName={Styles.btn}>
                <span className={Styles.iconDownload}><Icon glyph={Icon.GLYPHS.download}/></span> Download Data&nbsp;▾
            </Dropdown>
        );
    }
});

/**
 * Turns a file with the supplied type and stringified data into a data uri that can be set as the href of an anchor tag.
 */
function makeDataUri(type, dataString) {
    if (dataString) {
        // Using attachment/* mime type makes safari download as attachment.
        return 'data:attachment/' + type + ',' + encodeURIComponent(dataString);
    } else {
        return undefined;
    }
}

/**
 * Turns a 2-dimensional javascript object into a CSV string, with the first row being the property names and the second
 * row being the data. If the object is too hierarchical to be made into a CSV, returns undefined.
 */
function generateCsvData(data) {
    if (!data) {
        return;
    }

    const row1 = [];
    const row2 = [];
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const type = typeof data[key];

        // If data is too hierarchical to fit in a table, just return undefined as we can't generate a CSV.
        if (type === 'object' && data[key] !== null) { // covers both objects and arrays.
            return;
        }
        if (type === 'function') {
            // Ignore template functions we may add.
            continue;
        }

        row1.push(makeSafeForCsv(key));
        row2.push(makeSafeForCsv(data[key]));
    }

    return row1.join(',') + '\n' + row2.join(',');
}

/**
 * Makes a string safe for insertion into a CSV by wrapping it in inverted commas (") and changing inverted commas within
 * it to double-inverted-commas ("") as per CSV convention.
 */
function makeSafeForCsv(value) {
    value = value ? `${value}` : '';

    return '"' + value.replace(/"/g, '""') + '"';
}

export default FeatureInfoDownload;
