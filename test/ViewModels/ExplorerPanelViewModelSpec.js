'use strict';

var ExplorerPanelViewModel = require('../../lib/ViewModels/ExplorerPanelViewModel');
var ExplorerTabViewModel = require('../../lib/ViewModels/ExplorerTabViewModel');
var Terria = require('../../lib/Models/Terria');

describe('ExplorerPanelViewModel', function () {
    var terria;
    var panel;

    beforeEach(function () {
        terria = new Terria({
            baseUrl: './'
        });
    });

    function initPanel() {
        panel = new ExplorerPanelViewModel({
            terria: terria,
            tabs: [
                new ExplorerTabViewModel(),
                new ExplorerTabViewModel(),
                new ExplorerTabViewModel()
            ]
        });
    }

    describe('on init', function () {
        it('sets the initial tab to the value in terria.activeTabIndex', function () {
            terria.activeTabIndex = 1;
            initPanel();

            expect(panel.getActiveTabIndex()).toBe(1);
            expect(panel.tabs[1].isActive).toBe(true);
            expect(panel.tabs[0].isActive).toBe(false);

            // Ensure it doesn't only work for index === 1
            terria.activeTabIndex = 0;
            initPanel();

            expect(panel.getActiveTabIndex()).toBe(0);
            expect(panel.tabs[1].isActive).toBe(false);
            expect(panel.tabs[0].isActive).toBe(true);
        });
    });

    describe('when activating tab', function () {
        it('sets the activeTabIndex on terria', function() {
            initPanel();

            // Make sure this is 0 because we're going to change it.
            expect(terria.activeTabIndex).toBe(0);

            panel.activateTab(panel.tabs[1]);

            expect(terria.activeTabIndex).toBe(1);
        });
    });
});
