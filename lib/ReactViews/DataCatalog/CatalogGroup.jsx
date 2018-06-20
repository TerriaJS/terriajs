import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Loader from '../Loader';
import Icon from "../Icon";

import Styles from './data-catalog-group.scss';

/**
 * Dumb component that encapsulated the display logic for a catalog group.
 *
 * @constructor
 */
function CatalogGroup(props) {
    return (
        <li className={Styles.root}>
            <button type='button'
                    className={classNames(
                            Styles.btnCatalog,
                            {[Styles.btnCatalogTopLevel]: props.topLevel},
                            {[Styles.btnIsOpen]: props.open},
                            {[Styles.isPreviewed]: props.selected}
                        )}
                    title={props.title}
                    onClick={props.onClick}>
                <If condition={!props.topLevel}>
                 <span className={Styles.folder}>{props.open ? <Icon glyph={Icon.GLYPHS.folderOpen}/> : <Icon glyph={Icon.GLYPHS.folder}/>}</span>
                </If>
                {props.text}
                <span className={Styles.caret}>{props.open ? <Icon glyph={Icon.GLYPHS.opened}/> : <Icon glyph={Icon.GLYPHS.closed}/>}</span>
            </button>
            <If condition={props.open}>
                <ul className={classNames(
                        Styles.catalogGroup,
                        {[Styles.catalogGroupLowerLevel]: !props.topLevel}
                    )}>
                    <Choose>
                        <When condition={props.loading}>
                            <li key="loader">
                                <Loader />
                            </li>
                        </When>
                        <When condition={props.children.length === 0 && props.emptyMessage}>
                            <li className={classNames(Styles.label, Styles.labelNoResults)} key="empty">
                                {props.emptyMessage}
                            </li>
                        </When>
                    </Choose>
                    {props.children}
                </ul>
            </If>
        </li>
    );
}

CatalogGroup.propTypes = {
    text: PropTypes.string,
    title: PropTypes.string,
    topLevel: PropTypes.bool,
    open: PropTypes.bool,
    loading: PropTypes.bool,
    emptyMessage: PropTypes.string,
    onClick: PropTypes.func,
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element)
    ]),
    selected: PropTypes.bool
};

export default CatalogGroup;
