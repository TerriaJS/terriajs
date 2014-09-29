"use strict";

/*global require,$*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');

var corsProxy = require('../corsProxy');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var komapping = require('../../public/third_party/knockout.mapping');

var GeoDataInfoPopup = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var template = document.createElement('script');
    template.setAttribute('type', 'text/html');
    template.setAttribute('id', 'ausglobe-info-item-template');
    template.innerHTML = '\
            <tr>\
                <td class="ausglobe-info-properties-name-cell" data-bind="click: toggleOpen, css: \'ausglobe-info-properties-level\' + $parents.length + (hasChildren ? \' ausglobe-info-properties-parent\' : \'\')">\
                    <!-- ko if: hasChildren && isOpen -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowDownPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: hasChildren && !isOpen -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowRightPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: !hasChildren -->\
                    <div class="ausglobe-info-properties-arrow"></div>\
                    <!-- /ko -->\
                    <div class="ausglobe-info-properties-name" data-bind="text: name"></div>\
                </td>\
                <!-- ko if: hasChildren -->\
                    <td></td>\
                <!-- /ko -->\
                <!-- ko if: valueIsArray -->\
                    <td data-bind="foreach: value">\
                        <span data-bind="if: $index() !== 0">; </span>\
                        <span data-bind="text: $data"></span>\
                    </td>\
                <!-- /ko -->\
                <!-- ko ifnot: hasChildren || valueIsArray -->\
                    <td data-bind="text: value"></td>\
                <!-- /ko -->\
            </tr>\
            <!-- ko if: hasChildren && isOpen -->\
                <!-- ko template: { name: \'ausglobe-info-item-template\', foreach: items } -->\
                <!-- /ko -->\
            <!-- /ko -->';
    container.appendChild(template);

    var info = document.createElement('div');
    info.className = 'ausglobe-info';
    info.setAttribute('data-bind', 'css : { loadingIndicator : isLoading }');
    info.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1 data-bind="text: dataSource.name"></h1>\
        </div>\
        <div class="ausglobe-info-content">\
            <div class="ausglobe-info-section">\
                <!-- ko if: dataSource.description -->\
                <div class="ausglobe-info-description" data-bind="sanitizedHtml: dataSource.description"></div>\
                <!-- /ko -->\
                <!-- ko if: !dataSource.description -->\
                <div class="ausglobe-info-description">Please contact the provider of this data for more information, including information about usage rights and constraints.</div>\
                <!-- /ko -->\
            </div>\
            <div class="ausglobe-info-section">\
                <h2>Data Custodian</h2>\
                <div class="ausglobe-info-description" data-bind="sanitizedHtml: dataSource.dataCustodian"></div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.url">\
                <h2><span data-bind="text: dataSource.typeName"></span> Base URL</h2>\
                <input class="ausglobe-info-baseUrl" readonly type="text" data-bind="value: dataSource.url" size="80" onclick="this.select();" />\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.metadataUrl">\
                <h2>Metadata URL</h2>\
                <a class="ausglobe-info-description" data-bind="attr: { href: dataSource.metadataUrl }, text: dataSource.metadataUrl" target="_blank"></a>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.dataUrlType === \'wfs\' || dataSource.dataUrlType === \'wfs-complete\'">\
                <h2>Data URL</h2>\
                <div class="ausglobe-info-description">\
                    Use the link below to download GeoJSON data.  See the\
                    <a href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html" target="_blank">Web Feature Service (WFS) documentation</a>\
                    for more information on customising URL query parameters.\
                    <div><a data-bind="attr: { href: dataSource.dataUrl }, text: dataSource.dataUrl" target="_blank"></a></div>\
                </div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.dataUrlType === \'direct\'">\
                <h2>Data URL</h2>\
                <div class="ausglobe-info-description">\
                    Use the link below to download data directly.\
                    <div><a data-bind="attr: { href: dataSource.dataUrl }, text: dataSource.dataUrl" target="_blank"></a></div>\
                </div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.metadata.dataSourceMetadata.hasChildren">\
                <h2>Data Details</h2>\
                <div class="ausglobe-info-table">\
                    <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: dataSource.metadata.dataSourceMetadata.items }">\
                    </table>\
                </div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: dataSource.metadata.serviceMetadata.hasChildren">\
                <h2>Service Details</h2>\
                <div class="ausglobe-info-table">\
                    <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: dataSource.metadata.serviceMetadata.items }">\
                    </table>\
                </div>\
            </div>\
        </div>\
    ';
    wrapper.appendChild(info);

    var viewModel = this._viewModel = {
        _arrowDownPath : 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z',
        _arrowRightPath : 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z'
    };

    viewModel.isLoading = knockout.observable(true);
    viewModel.dataSource = options.dataSource;

    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    when(viewModel.dataSource.metadata.promise, function() {
        viewModel.isLoading(false);
    });

    knockout.applyBindings(this._viewModel, wrapper);
};

module.exports = GeoDataInfoPopup;
