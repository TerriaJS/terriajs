/*
*   Data Handling Widget
*   A set of UI functionality for working with the various datasets
*/
"use strict";

/*global require,Cesium,URI,$,alert,confirm*/
var GeoData = require('../GeoData');

var DeveloperError = Cesium.DeveloperError;
var loadJson = Cesium.loadJson;
var CesiumMath = Cesium.Math;
var Rectangle = Cesium.Rectangle;
var ScreenSpaceEventType = Cesium.ScreenSpaceEventType;
var when = Cesium.when;

//---------------------------------------------
// HTML Data Handling Widget
//---------------------------------------------

var GeoDataWidget = function(geoDataManager, setCurrentDataset) {

    this.geoDataManager = geoDataManager;
    this.setCurrentDataset = setCurrentDataset;
    this.scene = undefined;
    this.map = undefined;
    this.regionExt = undefined;

    var that = this;

    //Dialogs
    //Dialogs
    var div = document.createElement('div');
    div.id = 'dialogInfo';
    div.className = "dialog";
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogServices';
    div.className = "dialog";
    div.innerHTML = '<div id="list1" class="list"></div> \
            <div id="details" class="info"></div>';
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogShare';
    div.className = "dialog";
    div.innerHTML = ' \
            <form id="modalform" name="modalform"> \
                <img id="img1" src="./images/default.jpg" width="256"/> \
                Shareable URL: <br /><input type="text" name="url" id="url"/> \
            </form>';
    document.body.appendChild(div);

    //Data drag and drop support
    document.addEventListener("dragenter", noopHandler, false);
    document.addEventListener("dragexit", noopHandler, false);
    document.addEventListener("dragover", noopHandler, false);
    document.addEventListener("drop", function(evt) { dropHandler(evt, that); }, false);


    // Event watchers for geoDataManager
    geoDataManager.GeoDataAdded.addEventListener(function(collection, layer) {
        console.log('Vis Layer Added:', layer.name);
        layer.zoomTo = collection.zoomTo;
        that.setCurrentDataset(layer);
        collection.zoomTo = false;
    });

    geoDataManager.GeoDataRemoved.addEventListener(function(collection, layer) {
        console.log('Vis Layer Removed:', layer.name);
        that.setCurrentDataset();
    });

    geoDataManager.ViewerChanged.addEventListener(function(collection, obj) {
        console.log('Viewer Changed:', (obj.scene?'Cesium':'Leaflet'));
        that.scene = obj.scene;
        that.map = obj.map;
    });

    geoDataManager.ShareRequest.addEventListener(function(collection, request) {
        console.log('Share Request Event:');
        that.showShareDialog(request);
    });

        //TODO: should turn this off based on event from loadUrl
    $('#loadingIndicator').hide();

};

GeoDataWidget.prototype.setExtent = function(ext) {
    this.regionExt = ext;
};

// -----------------------------
// Handle file drop for CZML/GeoJSON/CSV
// -----------------------------
function noopHandler(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

function handleError(e) {
    alert('error loading data: ' + e.what);
}

function dropHandler(evt, that) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files;

    var count = files.length;
    console.log('Received ' + count + ' file(s)');

    for (var ndx = 0; ndx < count; ndx++) {
        var file = files[ndx];
        console.log(' - File Name: ' + file.name);

        that.geoDataManager.addFile(file);
    }
}

//Simple html dialog
GeoDataWidget.prototype.showHTMLTextDialog = function(title_text, display_text, b_modal, layer) {
    var that = this;
    
    if (b_modal === undefined) {
        b_modal = true;
    }
    $('#dialogInfo').html(display_text);
    var dlg_props = {
        title: title_text,
        modal: b_modal,
        width: 400,
        height: 400,
        position: {
            my: "middle center",
            at: "middle center",
            offset: "20 0",
            of: window
        }
    };
    if (layer !== undefined) {
        dlg_props.buttons = {
            "Load": function () {
                if (layer) {
                    that.geoDataManager.zoomTo = true;
                    that.geoDataManager.sendLayerRequest(layer);
                }
                $(this).dialog('close');
            }
        };
    }
    $('#dialogInfo').dialog(dlg_props);
};

GeoDataWidget.prototype.postToService = function(service, request) {
    var that = this;
    
    var formData = new FormData();
    for (var fld in request) {
        if (request.hasOwnProperty(fld)) {
            formData.append(fld, request[fld]);
        }
    }
    // submit and display returned html text
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var str, layer;
            if (xhr.status !== 200) {
                str = 'Error ' + xhr.status + ': ' + xhr.responseText;
            }
            else {
                var res = JSON.parse(xhr.responseText);
                str = res.displayHtml;
                if (res.layer !== undefined) {
                    str += '<h3>---------------</h3>';
                    str += 'Click the load button below to load the page from the service.';
                    layer = res.layer;
                }
            }
            that.showHTMLTextDialog(service.name + ' responded with', str, true, layer);
        }
    };
    xhr.open('POST', service.url);
    xhr.send(formData);
};

// Pick layer dialog
GeoDataWidget.prototype.showServicesDialog = function (request) {
    var that = this;
    
    var services = that.geoDataManager.getServices();

    $('#list1').height('150px');
    $("#dialogServices").dialog({
        title: 'Aditional Services (Experimental)',
        width: 300,
        height: 400,
        modal: false,
        position: {
            my: "left top",
            at: "left top",
            offset: "150 200",
            of: window
        },
        buttons: {
            "Select": function () {
                var item = $('#list1 .ui-selected');
                if (item !== undefined) {
                    var id = item[0].id;
                    that.postToService(services[id], request);
                }
                $(this).dialog('close');
            },
            'Close': function () {
                $(this).dialog('close');
            }
        }
    });
    var list = $('#list1');
    list.selectable({
        selected: function (event, ui) {
            var item = $('#list1 .ui-selected');
            var id = item[0].id;
            var service = services[id];
            var text = '<h3>' + service.name + '</h3>';
            if (service.description !== undefined) {
                text += service.description;
            }
            $('.info').html(text);
        }
    });

    list.html('');
    $('.info').html('');
    
    list.html('');
    for (var i = 0; i < services.length; i++) {
        var name = services[i].name;
        list.append('<li id=' + i + '>' + name + '</li>');
    }
    
    $('.info').html('<b>BUG:</b> First one should be selected, but does not work properly so click on first one (GeoSpace)');
/*
    // pre-select first one - doesn't work properly
    $(".ui-selected", $('#list1')).not($("li:first","#list1")).removeClass("ui-selected").addClass("ui-unselecting");
    $($("li:first","#list1")).not(".ui-selected").addClass("ui-selecting");
    $('#list1').data("selectable")._mouseStop(null);
*/
};


// Dialog to share a visualization
GeoDataWidget.prototype.showShareDialog = function (request) {
    var that = this;
    
    var url = that.geoDataManager.getShareRequestURL(request);

    $("#img1").attr("src", request.image);
    $("#url").attr("value", url);

    //Shows dialog
    $("#dialogShare").dialog({
        title: "Share",
        width: 300,
        height: 400,
        modal: true,
        position: {
            my: "left top",
            at: "left top",
            offset: "100 160",
            of: window
        },
        buttons: {
            'Copy': function () {
                window.prompt("To copy to clipboard: Ctrl+C, Enter", url);
                $(this).dialog('close');
            },
            'Embed': function () {
                var str = '&lt;iframe style="width: 720px; height: 405px; border: none;" src="' + url;
                str += '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen&gt;&lt;/iframe&gt;';
                that.showHTMLTextDialog("Copy this code to embed National Map in an HTML page", str, true);
                $(this).dialog('close');
            },
            'Services': function () {
                that.showServicesDialog(request);
            }
        }
    });
};

module.exports = GeoDataWidget;
