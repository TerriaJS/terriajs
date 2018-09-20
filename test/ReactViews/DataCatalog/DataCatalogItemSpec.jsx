import React from 'react';
import {shallow} from 'enzyme';

import Terria from  '../../../lib/Models/Terria';
import DataCatalogItem from '../../../lib/ReactViews/DataCatalog/DataCatalogItem';
import CatalogItemComponent from '../../../lib/ReactViews/DataCatalog/CatalogItem';
import ViewState from '../../../lib/ReactViewModels/ViewState';
import CatalogItem from '../../../lib/Models/CatalogItem';

import {USER_ADDED_CATEGORY_NAME} from '../../../lib/Core/addedByUser';

describe('DataCatalogItem', () => {
    let terria, viewState, item;

    beforeEach(() => {
        terria = new Terria({baseUrl: './'});

        viewState = new ViewState({terria});
        viewState.explorerPanelIsVisible = true;
        viewState.mobileView = viewState.mobileViewOptions.data;

        item = new CatalogItem(terria);
        item.isEnabled = false;

        spyOn(viewState, 'viewCatalogMember');
        spyOn(viewState, 'switchMobileView');
    });

    describe('text click', () => {
        beforeEach(() => {
            getRenderedProp('onTextClick')();
        });

        assertPreviewed();
        assertNotAdded();
    });

    describe('button click', () => {
        describe('when not on mobile and with a non-invokeable layer', () => {
            beforeEach(() => {
                clickAddButton({});
            });

            if(!item.isUserSupplied){
              assertPreviewed();
              assertAdded();
            }
        });

        describe('when on mobile', () => {
            beforeEach(() => {
                viewState.useSmallScreenInterface = true;
                clickAddButton({});
            });

            assertPreviewed();
            assertNotAdded();
        });

        describe('when with an invokeable layer', () => {
            beforeEach(() => {
                item.invoke = () => {
                };
                clickAddButton({});
            });
            if(!item.isUserSupplied){
              assertNotAdded();
            }
            assertNotAdded();


        });

        it('closes modal', () => {
            clickAddButton({});
            expect(viewState.explorerPanelIsVisible).toBe(false);
            expect(viewState.mobileView).toBeNull();
        });

        describe('does not close modal', () => {
            it('when control key pressed', () => {
                clickAddButton({ctrlKey: true});
            });

            it('when shift key pressed', () => {
                clickAddButton({shiftKey: true});
            });

            afterEach(() => {
                expect(viewState.explorerPanelIsVisible).toBe(true);
                expect(viewState.mobileView).not.toBeNull();
            });
        });

        function clickAddButton(event) {
            getRenderedProp('onBtnClick')(event);
        }
    });

    describe('renders', () => {
        it('a single <CatalogItem />', () => {
            expect(renderShallow().find(CatalogItemComponent).length).toBe(1);
        });

        describe('btnState prop as', () => {
            it('"loading" if item is loading', () => {
                item.isEnabled = true;
                item.isLoading = true;
                viewState.useSmallScreenInterface = true;
                expect(getRenderedProp('btnState')).toBe('loading');
            });

            it('"preview" if on mobile and not loading', () => {
                item.isEnabled = true;
                item.isLoading = false;
                viewState.useSmallScreenInterface = true;
                expect(getRenderedProp('btnState')).toBe('preview');
            });

            it('"remove" if item is enabled and not loading and not on mobile', () => {
                item.isEnabled = true;
                item.isLoading = false;
                expect(getRenderedProp('btnState')).toBe('remove');
            });

            it('"add" if item is not invokeable, not enabled and not loading and not on mobile', () => {
                expect(getRenderedProp('btnState')).toBe('add');
            });

            it('"stats" if item is invokeable, not enabled and not loading and not on mobile', () => {
                item.invoke = () => {
                };
                expect(getRenderedProp('btnState')).toBe('stats');
            });
        });

        describe('isSelected prop as', () => {
            describe('true when', () => {
                it('item is added by user and the current user data previewed item', () => {
                    makeItemUserAdded();
                    viewState.userDataPreviewedItem = item;
                });

                it('item is NOT added by user and IS the currently previewed data item', () => {
                    viewState.previewedItem = item;
                });

                afterEach(() => {
                    expect(getRenderedProp('selected')).toBe(true);
                });
            });

            describe('false when', () => {
                it('item is NOT added by user and NOT the current previewed item', () => {
                    // Assertion is done in afterEach so ¯\_(ツ)_/¯
                });

                it('item is added by user and NOT the current user data previewed item', () => {
                    makeItemUserAdded();
                });

                afterEach(() => {
                    expect(getRenderedProp('selected')).toBe(false);
                });
            });

            function makeItemUserAdded() {
                item.parent = new CatalogItem(terria);
                item.parent.name = USER_ADDED_CATEGORY_NAME;
            }
        });

        it('sets the CatalogItem text as the item name', () => {
            item.name = 'TEST!!!';
            expect(getRenderedProp('text')).toBe('TEST!!!');
        });
    });

    function assertPreviewed() {
        it('sets preview item', () => {
            expect(viewState.viewCatalogMember).toHaveBeenCalledWith(item);
        });

        it('switches mobile view to preview', () => {
            expect(viewState.switchMobileView).toHaveBeenCalledWith(viewState.mobileViewOptions.preview);
        });
    }

    function assertAdded() {
        it('enables item', () => {
            expect(item.isEnabled).toBe(true);
        });
    }

    function assertNotAdded() {
        it('doesn\'t enable item', () => {
            expect(item.isEnabled).toBe(false);
        });
    }

    function getRenderedProp(propName) {
        return renderShallow().find(CatalogItemComponent).first().prop(propName);
    }

    function renderShallow() {
        return shallow(<DataCatalogItem viewState={viewState} item={item}/>);
    }
});
