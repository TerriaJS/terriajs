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

    // -----------------------------
    // Handle mouse click on display object
    // -----------------------------
/*    var handler = new ScreenSpaceEventHandler(this.scene.canvas);
    handler.setInputAction(
        function (movement) {
            var pickedObject = that.scene.pick(movement.position);
            if (pickedObject !== undefined) {
                pickedObject = pickedObject.primitive;
            }
            if (pickedObject) {
                //show picking dialog
                var dlg_text = 'Item ' + pickedObject._index;
                var dlg_title = 'Info';
                showHTMLTextDialog(dlg_title, dlg_text, false);
            }
        },
        ScreenSpaceEventType.LEFT_CLICK);
*/

    //Drag and drop support
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

    //load list of available services for National Map
    Cesium.loadJson('./nm_services.json').then(function (obj) {
        that.services = obj.services;
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

function getOGCLayerExtent(layer) {
    var rect;
    var box;
    if (layer.WGS84BoundingBox) {
        var lc = layer.WGS84BoundingBox.LowerCorner.split(" ");
        var uc = layer.WGS84BoundingBox.UpperCorner.split(" ");
        rect = Rectangle.fromDegrees(parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]));
    }
    else if (layer.LatLonBoundingBox) {
        box = layer.LatLonBoundingBox || layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.minx), parseFloat(box.miny),
            parseFloat(box.maxx), parseFloat(box.maxy));
    }
    else if (layer.EX_GeographicBoundingBox) {
        box = layer.EX_GeographicBoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.westBoundLongitude), parseFloat(box.southBoundLatitude),
            parseFloat(box.eastBoundLongitude), parseFloat(box.northBoundLatitude));
    }
    else if (layer.BoundingBox) {
        box = layer.BoundingBox;
        rect = Rectangle.fromDegrees(parseFloat(box.west), parseFloat(box.south),
            parseFloat(box.east), parseFloat(box.north));
    }
    return rect;
}

//Simple html dialog
function showHTMLTextDialog(title_text, display_text, b_modal, close_function) {
    if (b_modal === undefined) {
        b_modal = true;
    }
    if (close_function === undefined) {
        close_function = function() {};
    }
    $('#dialogInfo').html(display_text);
    $('#dialogInfo').dialog({
        close: close_function,
        title: title_text,
        modal: b_modal,
        width: 300,
        position: {
            my: "middle center",
            at: "middle center",
            offset: "20 0",
            of: window
        }
    });
}


// Pick layer dialog
GeoDataWidget.prototype.showServicesDialog = function (request) {
    var that = this;
    
    var services = that.services;

    $('#list1').height('50px');
    $("#dialogServices").dialog({
        title: 'Aditional Services (Experimental)',
        width: 300,
        height: 300,
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
            var idx = item[0].id;
            var service = services[idx];
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
        height: 500,
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
                showHTMLTextDialog("Copy this code to embed National Map in an HTML page", str, true);
                $(this).dialog('close');
            },
            'Services': function () {
                that.showServicesDialog(request);
            },
            'GeoSpace': function () {
                var formData = new FormData();
                for (var fld in request) {
                    if (request.hasOwnProperty(fld)) {
                        formData.append(fld, request[fld]);
                    }
                }
                //TODO: include,resize image here based on user setting
                // submit and use the returned url provide share links
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        console.log('VisStore response: ' + xhr.responseText);
                        if (xhr.responseText === '') {
                            alert('Unable to send view to the server');
                            $("#dialogShare").dialog('close');
                        }
                        else {
                            var resp = JSON.parse(xhr.responseText);
                            var vis_url = that.geoDataManager.visServer + '?vis_id=' + resp.vis_id;
                            var geo_url = that.geoDataManager.visStore + '/details?vis_id=' + resp.vis_id;
                            var str = 'Here is the shortened link you can share with others:<br><a href="' + vis_url + '" target="_blank">' + vis_url + '</a>';
                            str +=  '<br><br>You can <a href="' + geo_url + '" target="_blank">Go to GeoSpace</a> to find other visualizations, add comments and share them in other ways.';
                            showHTMLTextDialog("Link to Visualization", str, true);
//                            $(this).dialog('close');
                       }
                    }
                };
                xhr.open('POST', that.geoDataManager.visStore + '/upload');
                xhr.send(formData);
             }
         }
    });
};

module.exports = GeoDataWidget;
