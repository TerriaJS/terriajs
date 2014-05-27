/*
*   Data Handling Widget
*   A set of UI functionality for working with the various datasets
*/

define([
        'ausglobe'
    ], function(
        ausglobe) {
    //---------------------------------------------
    // HTML Data Handling Widget
    //---------------------------------------------

    var GeoDataWidget = function(geoDataManager, setCurrentDataset) {
    
        this.geoDataManager = geoDataManager;
        this.setCurrentDataset = setCurrentDataset;
        this.scene = undefined;
        this.map = undefined;
        this.regionExt = undefined;
        
        var uri = new URI(window.location);
        var host = 'http://' + uri.hostname();
        if (uri.port() !== '80') {
            host += ':' + uri.port();
        }
        this.visViewer = host + uri.pathname();
    
            // Main menu buttons
        var div = document.createElement('div');
        div.id = 'product';
        div.innerHTML = '<p>National Map</p>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'menu';
        div.innerHTML = '<span id="add_button" class="menu_button" title="Add maps and data">Data</span>';
        document.body.appendChild(div);
        
        div = document.createElement('div');
        div.id = 'menu';
        div.innerHTML = '<span id="mod_button" class="menu_button" title="Edit your maps and data">Edit</span>';
        document.body.appendChild(div);
        
        div = document.createElement('div');
        div.id = 'menu';
        div.innerHTML = '<span id="share_button" class="menu_button" title="Share what you\'ve created">Share</span>';
        document.body.appendChild(div);
        
        $(".menu_button").button({
            text: true,
    //        icons: { primary: "ui-icon-gear" }
        }).css({ 'background': '#333333', 
            'color': '#eeeeee', 
            'border-color': '#555555',
            'width': '80px', 
            'border-radius': '1px'
            });
        
        var that = this;
        $("#add_button").click(function () { 
            closeDialogs(); 
            Cesium.loadJson('./data_collection.json').then(function (obj) {
                that.showSelectDialog(obj);
            });
        });
        $("#mod_button").click(function () { 
            closeDialogs(); 
            that.showLayersDialog(); 
        });
        $("#share_button").click(function () {
            closeDialogs();
            if (that.scene) {
                that.geoDataManager.shareRequest = true;
            }
            else {
                that.geoDataManager.setShareRequest({});
            }
        });
        
        //Dialogs
        div = document.createElement('div');
        div.id = 'dialogInfo';
        div.class = "dialog";
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'dialogServices';
        div.class = "dialog";
        div.innerHTML = '<div id="list2" class="list"></div> \
                <div>URL: <br /><input type="text" id="layer_url"></div>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'dialogSelect';
        div.class = "dialog";
        div.innerHTML = '<div id="list1" class="list"></div> \
                <div id="details" class="info"></div>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'dialogLayers';
        div.class = "dialog";
        div.innerHTML = '<div id="list3" class="list"></div>';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'dialogShare';
        div.class = "dialog";
        div.innerHTML = ' \
                <form id="modalform" name="modalform"> \
                    <img id="img1" src="./images/default.jpg" width="256"/> \
                         Title: <br /><input type="text" name="title" id="title" /><br /> \
                         Description: <br /><input type="text" name="description" id="description" /><br /> \
                         Tags: <br /><input type="text" name="tags" id="tags" /> \
                </form>';
        document.body.appendChild(div);

        // -----------------------------
        // Handle mouse click on display object
        // -----------------------------
    /*    var handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
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
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    */

        //Drag and drop support
        document.addEventListener("dragenter", noopHandler, false);
        document.addEventListener("dragexit", noopHandler, false);
        document.addEventListener("dragover", noopHandler, false);
        document.addEventListener("drop", function(evt) { dropHandler(evt, that); }, false);


        // Event watchers for geoDataManager
        geoDataManager.GeoDataAdded.addEventListener(function(collection, layer) { 
            console.log('Vis Layer Added:', layer.name);
            that.setCurrentDataset(layer);
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

        geoDataManager.loadUrl(window.location);

            //TODO: should turn this off based on event from loadUrl
        $('#loadingIndicator').hide();

    }
    
    GeoDataWidget.prototype.setExtent = function(ext) {
        this.regionExt = ext;
    }

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

    function loadLocalFile(path) {
        if (typeof path === 'undefined') {
            throw new Cesium.DeveloperError('path is required');
        }
        var reader = new FileReader();
        reader.readAsText(path);
        var deferred = Cesium.when.defer();
        reader.onload = function (event) {
            var allText = event.target.result;
            deferred.resolve(allText);
        };
        reader.onerror = function (e) {
            deferred.reject(e);
        };
        return deferred.promise;
    };

    var dropHandler = function (evt, that) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;

        var count = files.length;
        console.log('Received ' + count + ' file(s)');

        for (var ndx = 0; ndx < count; ndx++) {
            var file = files[ndx];
            console.log(' - File Name: ' + file.name);
            if (that.geoDataManager.formatSupported(file.name)) {
                Cesium.when(loadLocalFile(file), function (text) { 
                    if (!that.geoDataManager.loadText(text, file.name)) {
                        alert('This should have been handled but failed.');
                    }
                });
            }
            else {
                if (file.size > 100000) {
                    alert('File is too large to send to conversion service.  Click here for alternative file conversion options.');
                }
                else if (false) {
                        //TODO: check against list of support extensions
                    alert('File format is not supported by conversion service.  Click here for alternative file conversion options.');
                }
                else {
                    if (!confirm('No local format handler.  Click OK to convert via our web service.')) {
                        return;
                    }
                    // generate form data to submit text for conversion
                    var formData = new FormData();
                    formData.append('input_file', file);
                    
                    var xhr = new XMLHttpRequest;
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            var response = xhr.responseText;
                            if (response.substring(0,1) !== '{') {
                                console.log(response);
                                alert('Error trying to convert: ' + file.name);
                            }
                            else {
                                that.geoDataManager.loadText(response, file.name+'.geojson');
                            }
                        }
                    }
                    xhr.open('POST', that.geoDataManager.visStore + '/convert');
                    xhr.send(formData);
                }
            }
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
        if (layer.WGS84BoundingBox) {
            var lc = layer.WGS84BoundingBox.LowerCorner.split(" ");
            var uc = layer.WGS84BoundingBox.UpperCorner.split(" ");
            rect = Cesium.Rectangle.fromDegrees(parseFloat(lc[0]), parseFloat(lc[1]), parseFloat(uc[0]), parseFloat(uc[1]));
        }
        else if (layer.LatLonBoundingBox) {
            var box = layer.LatLonBoundingBox || layer.BoundingBox;
            rect = Cesium.Rectangle.fromDegrees(parseFloat(box.minx), parseFloat(box.miny), 
                parseFloat(box.maxx), parseFloat(box.maxy));
        }
        else if (layer.EX_GeographicBoundingBox) {
            var box = layer.EX_GeographicBoundingBox;
            rect = Cesium.Rectangle.fromDegrees(parseFloat(box.westBoundLongitude), parseFloat(box.southBoundLatitude), 
                parseFloat(box.eastBoundLongitude), parseFloat(box.northBoundLatitude));
        }
        else if (layer.BoundingBox) {
            var box = layer.BoundingBox;
            rect = Cesium.Rectangle.fromDegrees(parseFloat(box.west), parseFloat(box.south), 
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
       
                        var layer = new ausglobe.GeoData({ 
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
            },
        });
        var list = $('#list1');
        list.selectable({
            selected: function (event, ui) {
                var item = $('#list1 .ui-selected');
                var idx = item[0].id;
                var layer = sel_list[parseInt(idx)];
                var text = '<b>Selected:</b><br>' + layer.Title;
                if (layer.Abstract !== undefined) {
                    text += '<br>' + layer.Abstract;
                }
                    //capture the layer extent for display and later use
                data_extent = getOGCLayerExtent(layer);
                if (data_extent) {
                    text += '<br>'+Cesium.Math.toDegrees(data_extent.west).toFixed(3)
                            +', '+Cesium.Math.toDegrees(data_extent.south).toFixed(3)
                            +'<br>'+Cesium.Math.toDegrees(data_extent.east).toFixed(3)
                            +', '+Cesium.Math.toDegrees(data_extent.north).toFixed(3);
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
    }
    
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
                },
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
            var name = services.Layer[n].name
            list.append('<p class="data_type"><b>' + name + '</b></p>');
            var layers = services.Layer[n].Layer;
            for (var i = 0; i < layers.length; i++) {
                var item = layers[i];
                var ndx = sel_list.length;
                list.append('<li id=' + ndx + '>' + item.name + '</li>');
                sel_list.push(item);
            }
        }
    }
    
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
    }


    // share the link handlers
    function fbShare(url, record_url, image_url) {
        //get the record from the server and use it to populate the fields
        Cesium.when(Cesium.loadJson(record_url), function (obj) {
            var winWidth = 640;
            var winHeight = 480;
            var winTop = (screen.height / 2) - (winHeight / 2);
            var winLeft = (screen.width / 2) - (winWidth / 2);
            var str1 = encodeURI('http://www.facebook.com/sharer.php?s=100&p[title]=' + obj.title + '&p[summary]=' + obj.description + '&p[url]=' + url + '&p[images][0]=' + image_url);
            var str2 = 'sharer';
            var str3 = 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight;
            window.open(str1, str2, str3);
        });
    }

    function embedShare(url) {
        var str = '&lt;iframe style="width: 720px; height: 405px; border: none;" src="' + url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen&gt;&lt;/iframe&gt;';
        showHTMLTextDialog("IFrame to Embed in HTML", str, true);
    }

    function linkShare(url) {
        var str = 'You can use this link to view or share your visualization:<br><a href="' + url + '" target="_blank">' + url + '</a>';
        showHTMLTextDialog("Link to Visualization", str, true);
    }

    // Dialog to post current view to server
    GeoDataWidget.prototype.postViewToServer = function (request) {
        var that = this;

        var formValues = request;
        
        $("#title").attr("value", formValues.title);
        $("#description").attr("value", formValues.description);
        $("#tags").attr("value", formValues.tags);
        $("#img1").attr("src", formValues.image);
        
        //Shows dialog
        $("#dialogShare").dialog({
            title: "Share",
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
                "Cancel": function () {
                    $(this).dialog("close");
                },
                "Send": function () {
                    var formEntries = [];
                    $.each($('#dialogShare').serializeArray(), function(i, field) {
                        formEntries[field.name] = field.value;
                    });
                    
                    // generate form data to submit
                    var formData = new FormData();
                    for (var fld in formValues) {
                        if (formValues.hasOwnProperty(fld) === false)
                            continue;
                        if (formEntries[fld]) {
                            formData.append(fld, formEntries[fld]);
                        }
                        else {
                            formData.append(fld, formValues[fld]);
                        }
                    }
                    //TODO: include,resize image here based on user setting
                    // submit and use the returned url provide share links
                    var xhr = new XMLHttpRequest;
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            console.log('VisStore response: ' + xhr.responseText);
                            if (xhr.responseText === '') {
                                alert('Unable to send view to the server');
                                $("#dialogShare").dialog('close');
                            }
                            else {
                                var resp = JSON.parse(xhr.responseText);
                                var url = that.visViewer + '?vis_id=' + resp.vis_id;
                                $("#dialogShare").dialog('option', 'buttons', {
                                    'FB': function () {
                                        var record_url = that.geoDataManager.visStore + '/get_rec?vis_id=' + resp.vis_id;
                                        var image_url = that.geoDataManager.visStore + '/images/' + resp.vis_id + '_thumb.jpg';
                                        fbShare(url, server_url, image_url);
                                        $(this).dialog('close');
                                    },
                                    'Embed': function () {
                                        embedShare(url);
                                        $(this).dialog('close');
                                    },
                                    'Link': function () {
                                        linkShare(url);
                                        $(this).dialog('close');
                                    },
/*                                    //TODO: disable if not logged in
                                    'Gallery': function () {
                                        url = that.geoDataManager.visStore + '/details?vis_id=' + resp.vis_id;
                                        window.parent.document.location.assign(url);
                                        $(this).dialog('close');
                                    },
*/                                    "Close": function () {
                                        $(this).dialog("close");
                                    }
                                });

                           }
                        }
                    }
                    xhr.open('POST', that.geoDataManager.visStore + '/upload');
                    xhr.send(formData);
                }
            }
        });
    }
    
	return GeoDataWidget;
});
