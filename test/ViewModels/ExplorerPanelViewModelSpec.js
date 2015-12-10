'use strict';

var ExplorerPanelViewModel = require('../../lib/ViewModels/ExplorerPanelViewModel');
var ExplorerTabViewModel = require('../../lib/ViewModels/ExplorerTabViewModel');
var Terria = require('../../lib/Models/Terria');

describe('ExplorerPanelViewModel', function() {
    var terria;
    var panel;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        // Set up active tab id as an observable.
        terria.getUserProperty('activeTabId');
    });

    function initPanel(tabs) {
        panel = new ExplorerPanelViewModel({
            terria: terria,
            tabs: tabs || [
                new ExplorerTabViewModel('Tab 1', 'Tab1'),
                new ExplorerTabViewModel('Tab 2', 'Tab2'),
                new ExplorerTabViewModel('Tab 3', 'Tab3')
            ]
        });
    }

    describe('on init', function() {
        it('sets the initial tab to the value in terria.userProperties.activeTabId', function() {
            terria.userProperties.activeTabId = 'Tab2';
            initPanel();

            expect(panel.getActiveTabIndex()).toBe(1);
            expect(panel.tabs[1].isActive).toBe(true);
            expect(panel.tabs[0].isActive).toBe(false);

            // Ensure it doesn't only work for index === 1
            terria.userProperties.activeTabId = 'Tab1';
            initPanel();

            expect(panel.getActiveTabIndex()).toBe(0);
            expect(panel.tabs[1].isActive).toBe(false);
            expect(panel.tabs[0].isActive).toBe(true);
        });

        it('selects the first tab if no value for terria.userProperties.activeTabId', function() {
            delete terria.userProperties.activeTabId;

            initPanel();

            expect(panel.getActiveTabIndex()).toBe(0);
            expect(panel.tabs[0].isActive).toBe(true);
        });

        it('selects the first tab if terria.userProperties.activeTabId doesn\'t match a tab id', function() {
            terria.userProperties.activeTabId = 'aerogijaeorginarevoeogtierta';

            initPanel();

            expect(panel.getActiveTabIndex()).toBe(0);
            expect(panel.tabs[0].isActive).toBe(true);
        });

        it('avoids tab id collisions by modifying the ids of colliding tabs', function() {
            initPanel([
                new ExplorerTabViewModel('Tab 1', 'Tab1'),
                new ExplorerTabViewModel('Tab 1', 'Tab1'),
                new ExplorerTabViewModel('Tab 1', 'Tab1')
            ]);

            expect(panel.tabs.length).toBe(3);
            expect(panel.tabs[0].id).toBe('Tab1');
            expect(panel.tabs[1].id).not.toBe(panel.tabs[0].id);
            expect(panel.tabs[2].id).not.toBe(panel.tabs[1].id);
            expect(panel.tabs[2].id).not.toBe(panel.tabs[0].id);
        });
    });

    describe('when adding a tab', function() {
        it('avoids tab id collisions by modifying the ids of colliding tabs', function() {
            initPanel();

            // Make sure we have an tab with id 1 as expected.
            expect(panel.tabs[0].id).toBe('Tab1');

            panel.addTab(new ExplorerTabViewModel('Tab 1', 'Tab1'));

            expect(panel.tabs[3].id).not.toBe('Tab1');

            panel.addTab(new ExplorerTabViewModel('Tab 1', 'Tab1'));

            expect(panel.tabs[4].id).not.toBe('Tab1');

            // Original tab should still be the same.
            expect(panel.tabs[0].id).toBe('Tab1');
        });
    });

    describe('when activating tab', function() {
        it('changes the activeTabId user property when tab is activated', function() {
            initPanel();

            // Make sure this is not Tab2 because we're going to switch to Tab2.
            expect(terria.getUserProperty('activeTabId')).not.toBe('Tab2');

            panel.activateTab(panel.tabs[1]);

            expect(terria.getUserProperty('activeTabId')).toBe('Tab2');
        });
    });
});
