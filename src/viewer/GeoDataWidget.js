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
    var div = document.createElement('div');
    div.id = 'dialogInfo';
    div.className = "dialog";
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogServices';
    div.className = "dialog";
    div.innerHTML = '<div id="list2" class="list"></div> \
            <div>URL: <br /><input type="text" id="layer_url"></div>';
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogSelect';
    div.className = "dialog";
    div.innerHTML = '<div id="list1" class="list"></div> \
            <div id="details" class="info"></div>';
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogLayers';
    div.className = "dialog";
    div.innerHTML = '<div id="list3" class="list"></div>';
    document.body.appendChild(div);

    div = document.createElement('div');
    div.id = 'dialogShare';
    div.className = "dialog";
    div.innerHTML = ' \
            <form id="modalform" name="modalform"> \
                <img id="img1" src="./images/default.jpg" width="256"/> \
                URL: <br /><input type="text" name="url" id="url"/> \
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
        console.log('Share Request Event:', request);
        that.postViewToServer(request);
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

function closeDialog(name) {
    if ($(name).hasClass('ui-dialog-content') && $(name).dialog( "isOpen" ) === true) {
        $(name).dialog("close");
    }
}

function closeDialogs() {
    closeDialog("#dialogServices");
    closeDialog("#dialogSelect");
    closeDialog("#dialogLayers");
    closeDialog("#dialogShare");
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

// Pick layer dialog
GeoDataWidget.prototype.showSelectDialog = function (collection) {
    var data_extent;
    var that = this;

    console.log(collection);

    //TODO: add checkbox to set extent from current view (default on)

    $('#list1').height('250px');
    $("#dialogSelect").dialog({
        title: collection.name,
        width: 300,
        height: 500,
        modal: false,
        position: {
            my: "left top",
            at: "left top",
            offset: "85 78",
            of: window
        },
        buttons: {
            'services' : {
                text: 'Other Data', click: function () {
                    $(this).dialog("close");
                    that.showServicesDialog(that.geoDataManager.serviceList);
                }
            },
            'select': {
                text: 'Add', click: function () {
                    var item = $('#list1 .ui-selected');
                    var idx = item[0].id;
                    var description = sel_list[idx];

                        // Set bbox for call
                    if (data_extent !== undefined) {
                        description.extent = data_extent;
                    }
                    if (that.regionExt !== undefined) {
                        description.extent = that.regionExt;
                    }

                    var layer = new GeoData({
                        name: description.Name,
                        type: description.type,
                        extent: description.extent
                    });

                    console.log(description);
                    if (sel_list[idx].url !== undefined) {
                        layer.url = sel_list[idx].url;
                    }
                    else if (description.type === 'CKAN') {
                        for (var i = 0; i < sel_list[idx].resources.length; i++) {
                            if (sel_list[idx].resources[i].format.toUpperCase() === 'JSON') {
                                layer.url = sel_list[idx].resources[i].url;
                            }
                        }
                    }
                    else {
                        // description.count = 100;
                        layer.url = that.geoDataManager.getOGCFeatureURL(description);
                    }
                    //pass leaflet map object if exists
                    layer.map = that.map;
                    layer.proxy = description.proxy;

                    that.geoDataManager.sendLayerRequest(layer);

                    $(this).dialog("close");
                }
            }
        }
    });
    var list = $('#list1');
    list.selectable({
        selected: function (event, ui) {
            var item = $('#list1 .ui-selected');
            var idx = item[0].id;
            var layer = sel_list[parseInt(idx, 10)];
            var text = '<b>Selected:</b><br>' + layer.Title;
            if (layer.Abstract !== undefined) {
                text += '<br>' + layer.Abstract;
            }
                //capture the layer extent for display and later use
            data_extent = getOGCLayerExtent(layer);
            if (data_extent) {
                text += '<br>' + CesiumMath.toDegrees(data_extent.west).toFixed(3) +
                        ', ' + CesiumMath.toDegrees(data_extent.south).toFixed(3) +
                        '<br>' + CesiumMath.toDegrees(data_extent.east).toFixed(3) +
                        ', ' + CesiumMath.toDegrees(data_extent.north).toFixed(3);
            }
            $('.info').html(text);
        }
    });

    list.html('');
    $('.info').html('');
    var sel_list = [];

    var layers = collection.Layer;

    for (var n = 0; n < layers.length; n++) {
        var datasets, parent;
        if (layers[n].Layer === undefined) {
            datasets = layers;
            parent = collection;
        }
        else {
            list.append('<p class="data_type"><b>' + layers[n].name + '</b></p>');
            datasets = layers[n].Layer;
            parent = layers[n];
        }
        var name;
        for (var i = 0; i < datasets.length; i++) {
            var item = datasets[i];
            for (var p in parent) {
                if (!(parent[p] instanceof Array) && item[p] === undefined) {
                    item[p] = parent[p];
                }
            }
            if (item.Title !== undefined) {
                name = item.Title;
            }
            else {
                name = item.Name.split(':');
                name = name[name.length - 1];
            }
            var ndx = sel_list.length;
            list.append('<li id=' + ndx + '>' + name + '</li>');
            sel_list.push(item);
        }
        if (layers[n].Layer === undefined) {
            break;
        }
    }
};

// Pick Service Dialog
GeoDataWidget.prototype.showServicesDialog = function (services) {
    var that = this;

    $('#list2').height('300px');
    $('#dialogServices').dialog({
        title: services.name,
        modal: false,
        width: 300,
        height: 500,
        position: {
            my: "left top",
            at: "left top",
            offset: "85 78",
            of: window
        },
        buttons: {
            "Cancel": function () {
                $(this).dialog("close");
            },
            "OK": function () {
                var description;
                var url = $('#layer_url').val();
                if (url === '') {
                    var item = $('#list2 .ui-selected');
                    var id = item[0].id;
                    description = sel_list[id];
                }
                else {
                     description = {name: 'User Entered', base_url: url, type: 'WFS', proxy: true};
                }
                if (description !== undefined) {
                    console.log('Getting: ' + description.base_url);
                    that.geoDataManager.getCapabilities(description, function(desc) { that.showSelectDialog(desc); });
                    $(this).dialog("close");
                }
            }
        }
    });

    var list = $('#list2');
    list.selectable({
        selected: function (event, ui) {
            var item = $('#list2 .ui-selected');
        }
    });
    list.html('');

    var sel_list = [];
    for (var n = 0; n < services.Layer.length; n++) {
        var name = services.Layer[n].name;
        list.append('<p class="data_type"><b>' + name + '</b></p>');
        var layers = services.Layer[n].Layer;
        for (var i = 0; i < layers.length; i++) {
            var item = layers[i];
            var ndx = sel_list.length;
            list.append('<li id=' + ndx + '>' + item.name + '</li>');
            sel_list.push(item);
        }
    }
};

// Update layers dialog
GeoDataWidget.prototype.showLayersDialog = function () {
    var that = this;

    var layers = this.geoDataManager.layers;

    $('#list3').height('300px');
    $("#dialogLayers").dialog({
        title: 'Edit',
        width: 300,
        height: 500,
        modal: false,
        position: {
            my: "left top",
            at: "left top",
            offset: "85 78",
            of: window
        },
        buttons: {
            "Goto": function () {
                var item = $('#list3 .ui-selected');
                if (item !== undefined) {
                    var id = item[0].id;
                    var layer = layers[id];
                    that.geoDataManager.GeoDataAdded.raiseEvent(that.geoDataManager, layer);
                }
            },
            "Remove": function () {
                var item = $('#list3 .ui-selected');
                if (item !== undefined && confirm('Remove this layer?')) {
                    var id = item[0].id;
                    var layer = layers[id];
                    that.geoDataManager.GeoDataRemoved.raiseEvent(that.geoDataManager, layer);
                    that.geoDataManager.remove(id);
                    //rebuild the display list
                    list.html('');
                    for (var i = 0; i < layers.length; i++) {
                        var name = layers[i].name;
            //            list.append('<li id=' + i + '>' + name + '</li>');
                        list.append('<input type="checkbox" name="' + name + '" id=' + i + ' checked><label for=' + i + ' id=' + i + '>' + name + '</label><br>');
                    }
                }
            },
            "Edit": function () {
                var item = $('#list3 .ui-selected');
                if (item !== undefined) {
                    var id = item[0].id;
                    alert('NYI:\nCall the appropriate line/point/time/map edit dialog for : ' + layers[id].name);
                }
            }
        }
    });

    var list = $('#list3');
    list.selectable({
        selected: function (event, ui) {
            var item = $('#list3 .ui-selected');
        }
    });
    list.html('');
    for (var i = 0; i < layers.length; i++) {
        var name = layers[i].name;
//            list.append('<li id=' + i + '>' + name + '</li>');
        var show = (layers[i].show) ? 'checked' : 'unchecked';
        list.append('<input type="checkbox" name="' + name + '" id=' + i + ' '+show+'><label for=' + i + ' id=' + i + '>' + name + '</label><br>');
    }
      //dialog for hiding and showing
    $('#dialogLayers :checkbox').click(function() {
        var $this = $(this);
        var id = $this[0].id;
        var layer = layers[id];
        if ($this.is(':checked')) {
            that.geoDataManager.show(layer, true);
        } else {
            that.geoDataManager.show(layer, false);
        }
    });
};


function embedShare(url) {
}
// Dialog to share a visualization
GeoDataWidget.prototype.postViewToServer = function (request) {
    var that = this;
    
    var url = that.geoDataManager.getShareRequestURL(request);

    $("#img1").attr("src", request.image);
    $("#url").attr("value", url);

    //Shows dialog
    $("#dialogShare").dialog({
        title: "Share",
        width: 300,
        height: 400,
        modal: false,
        position: {
            my: "left top",
            at: "left top",
            offset: "85 78",
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
                showHTMLTextDialog("IFrame to Embed in HTML", str, true);
                $(this).dialog('close');
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
                            var str = 'Shortened Link:<br><a href="' + vis_url + '" target="_blank">' + vis_url + '</a>';
                            str +=  '<br><br><a href="' + geo_url + '" target="_blank">Go to GeoSpace</a>';
                            showHTMLTextDialog("Link to Visualization", str, true);
                            $(this).dialog('close');
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
