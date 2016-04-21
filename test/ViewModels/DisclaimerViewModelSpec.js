'use strict';

/*global require*/
var DisclaimerViewModel = require('../../lib/ViewModels/DisclaimerViewModel');
var Terria = require('../../lib/Models/Terria');
var CatalogItem = require('../../lib/Models/CatalogItem');
var PopupMessageViewModel = require('../../lib/ViewModels/PopupMessageViewModel');
var PopupMessageConfirmationViewModel = require('../../lib/ViewModels/PopupMessageConfirmationViewModel');
var clone = require('terriajs-cesium/Source/Core/clone');

var DEFAULT_INITIAL_MESSAGE = Object.freeze({
    key: 'blah',
    title: 'blahTitle',
    content: 'blahContent',
    width: 150,
    height: 510,
    confirmText: 'blahConfirm'
});
var UI_CONTAINER = 'ui';

describe('DisclaimerViewModel', function() {
    var terria, catalogItem;
    var disclaimerVm; // eslint-disable-line no-unused-vars
    var successCallback, keyRecorded;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        catalogItem = new CatalogItem(terria);
        catalogItem.initialMessage = clone(DEFAULT_INITIAL_MESSAGE);

        successCallback = jasmine.createSpy('successCallback');

        disclaimerVm = new DisclaimerViewModel(UI_CONTAINER, terria);

        keyRecorded = false;
        spyOn(terria, 'getLocalProperty').and.callFake(function(key) {
            if (key === DEFAULT_INITIAL_MESSAGE.key) return keyRecorded;
        });
        spyOn(terria, 'setLocalProperty');
        spyOn(PopupMessageViewModel, 'open');
        spyOn(PopupMessageConfirmationViewModel, 'open');
    });

    it('should allow an already-accepted disclaimer to go straight through without displaying', function() {
        keyRecorded = true;

        terria.disclaimerListener(catalogItem, successCallback);

        expect(successCallback).toHaveBeenCalled();
        expect(PopupMessageViewModel.open).not.toHaveBeenCalled();
        expect(PopupMessageConfirmationViewModel.open).not.toHaveBeenCalled();
    });

    describe('for a non-confirmation disclaimer', function() {
        beforeEach(function() {
            terria.disclaimerListener(catalogItem, successCallback);
        });

        it('should open a popup message', function() {
            expect(PopupMessageViewModel.open).toHaveBeenCalled();
            checkOptions(PopupMessageViewModel.open.calls.argsFor(0)[1]);
        });

        it('should immediately execute the success callback', function() {
            expect(successCallback).toHaveBeenCalled();
        });

        it('should record the popup message as being shown in local storage', function() {
            expect(terria.setLocalProperty).toHaveBeenCalledWith(DEFAULT_INITIAL_MESSAGE.key, true);
        });

        it('should pass the ui container straight through to the modal', function() {
            expect(PopupMessageViewModel.open.calls.argsFor(0)[0]).toBe(UI_CONTAINER);
        });
    });

    describe('for a non-confirmation disclaimer', function() {
        beforeEach(function() {
            catalogItem.initialMessage.confirmation = true;
        });

        it('if no key is specified, opens a confirmation dialog with the correct success callback', function() {
            catalogItem.initialMessage.key = undefined;

            terria.disclaimerListener(catalogItem, successCallback);

            var options = PopupMessageConfirmationViewModel.open.calls.argsFor(0)[1];
            checkOptions(options);
            expect(successCallback).not.toHaveBeenCalled();
            options.confirmAction();
            expect(successCallback).toHaveBeenCalled();
        });

        it('should pass options from the catalogItem correctly', function() {
            terria.disclaimerListener(catalogItem, successCallback);
            checkOptions(PopupMessageConfirmationViewModel.open.calls.argsFor(0)[1]);
        });

        it('should pass the ui container straight through to the modal', function() {
            terria.disclaimerListener(catalogItem, successCallback);
            expect(PopupMessageConfirmationViewModel.open.calls.argsFor(0)[0]).toBe(UI_CONTAINER);
        });

        describe('if a key is specified', function() {
            beforeEach(function() {
                terria.disclaimerListener(catalogItem, successCallback);
            });

            it('should not record the popup message as being accepted in local storage until after the success ' +
                'callback is executed', function() {
                expect(terria.setLocalProperty).not.toHaveBeenCalled();

                PopupMessageConfirmationViewModel.open.calls.argsFor(0)[1].confirmAction();

                expect(terria.setLocalProperty).toHaveBeenCalledWith(DEFAULT_INITIAL_MESSAGE.key, true);
            });

            it('should only a modal once for a certain key', function() {
                terria.disclaimerListener(catalogItem, successCallback);
                terria.disclaimerListener(catalogItem, successCallback);

                expect(PopupMessageConfirmationViewModel.open.calls.count()).toBe(1);
            });
        });

        describe('if multiple items with keys are specified', function() {
            var catalogItem2, item1Callbacks, item2Callbacks;

            beforeEach(function() {
                catalogItem2 = new CatalogItem(terria);
                catalogItem2.initialMessage = clone(catalogItem.initialMessage);
                catalogItem2.initialMessage.key = 'blahKey2';
                catalogItem2.initialMessage.title = 'blahTitle2';

                item1Callbacks = [];
                item2Callbacks = [];

                for (var i = 1; i <= 3; i++) {
                    var item1Callback = jasmine.createSpy('item 1 callback ' + i);
                    terria.disclaimerListener(catalogItem, item1Callback);
                    item1Callbacks.push(item1Callback);

                    var item2Callback = jasmine.createSpy('item 2 callback ' + i);
                    terria.disclaimerListener(catalogItem2, item2Callback);
                    item2Callbacks.push(item2Callback);
                }
            });

            it('should open 2 modals for 2 different keys regardless of how many events for each are triggered', function() {
                expect(PopupMessageConfirmationViewModel.open.calls.count()).toBe(2);
                expect(PopupMessageConfirmationViewModel.open.calls.argsFor(0)[1].title).toBe('blahTitle');
                expect(PopupMessageConfirmationViewModel.open.calls.argsFor(1)[1].title).toBe('blahTitle2');
            });

            it('should trigger all callbacks for a key after that key\'s modal is dismissed', function() {
                item1Callbacks.concat(item2Callbacks).forEach(function(cb) {
                   expect(cb).not.toHaveBeenCalled();
                });

                // Click OK on first modal
                PopupMessageConfirmationViewModel.open.calls.argsFor(0)[1].confirmAction();

                // Item 1 callbacks should all have been called, but item 2 callbacks should not be
                item1Callbacks.forEach(function(cb) {
                    expect(cb).toHaveBeenCalled();
                });
                item2Callbacks.forEach(function(cb) {
                    expect(cb).not.toHaveBeenCalled();
                });

                // Click OK on second callback
                PopupMessageConfirmationViewModel.open.calls.argsFor(1)[1].confirmAction();

                // Now second callbacks should've been called too.
                item2Callbacks.forEach(function(cb) {
                    expect(cb).toHaveBeenCalled();
                });
            });
        });
    });
});

function checkOptions(options) {
    expect(options.title).toBe(DEFAULT_INITIAL_MESSAGE.title);
    expect(options.message).toBe('<div>' + DEFAULT_INITIAL_MESSAGE.content + '</div>');
    expect(options.width).toBe(DEFAULT_INITIAL_MESSAGE.width);
    expect(options.height).toBe(DEFAULT_INITIAL_MESSAGE.height);
    expect(options.confirmText).toBe(DEFAULT_INITIAL_MESSAGE.confirmText);
}
