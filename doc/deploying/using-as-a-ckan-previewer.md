## CKAN previewer

**Warning: This feature is only supported by v7 TerriaMaps.**

The CKAN previewer is a plugin for CKAN which uses TerriaJS to preview geospatial content using an iframe. It is provided in the [/ckanext-cesiumpreview folder of TerriaMap](https://github.com/TerriaJS/TerriaMap/tree/master/ckanext-cesiumpreview).

###To create a CKAN installation with docker

Follow the instructions in the CKAN documentation [here](http://docs.ckan.org/en/latest/maintaining/installing/install-using-docker.html)

###To create a CKAN installation from source

Install a local instance of CKAN per http://docs.ckan.org/en/ckan-2.0/install-from-source.html
Follow all the steps :

- In step 1 install openjdk-7-jdk instead of openjdk-6-jdk
- in step 2c use requirements.txt instead of pip-requirements.txt
- In step 3 making 'pass' your password will makes things simpler
- Set up the optional Solr install as per step 5 (Single Solr instance)
- Step 6 can take a long time. If it does fail drop the ckan_default database and redo step 3 and try again
- You do no need to set up the optional DataStore install as per step 7

To add local storage of files

    sudo mkdir -p /var/lib/ckan/default
    sudo chmod 777 /var/lib/ckan/default

in development.ini under storage settings add

    nano /etc/ckan/default/development.ini
    ckan.storage_path = /var/lib/ckan/default

And to run the server

    . /usr/lib/ckan/default/bin/activate
    cd /usr/lib/ckan/default/src/ckan
    paster serve /etc/ckan/default/development.ini

To install spatial extension for spatial queries and previewers, see http://docs.ckan.org/projects/ckanext-spatial/en/latest/install.html

####To make sysadmin account

    paster sysadmin add admin -c /etc/ckan/default/development.ini

###To add Cesium Previewer

TODO: Update this to use our ckan previewer plugin. Will require a standalone github be created for the plugin

`pip install -e git+https://github.com/NICTA/nationalmap-preview#egg=cesiumpreviewer`

Make a virtual link to the viewer in CKAN to the cesiumviewer.

    ln -s ~/nationalmap/ckanext-cesiumpreview/ckanext/cesiumpreview ~/ckan/lib/default/src/ckan/ckanext/cesiumpreview

In the CKAN development.ini under storage settings add the plugin

    nano /etc/ckan/default/development.ini
    ckan.plugins = cesium_viewer ...

There may be a more automatic way to do this, but I'm just patching files in CKAN to handle the cesium previewer in the same way as the recline previewer. So first open setup.py for editing.

    nano ~/ckan/lib/default/src/ckan/setup.py

And add the following line under the recline_preview plugin entry (line ~76)

     'cesium_preview = ckanext.reclinepreview.plugin:CesiumPreview',

Then patch entry_points.txt

      nano ~/ckan/lib/default/src/ckan/ckan.egg-info/entry_points.txt

And add the following line under the recline_preview plugin entry (line ~76)

      cesium_preview = ckanext.cesiumpreview.plugin:CesiumPreview

That should be it. The cesium previewer is pointing to the instance at nationalmap.research.nicta.com.au. If you need to update the cesium_previewer path to a different location then edit the vis_server variable in preview_cesium.js

      nano ~/nationalmap/cesiumpreview/theme/public/preview_cesium.js

If all went correctly you should be able to start the CKAN server in virtualenv and access the server at http://127.0.0.1:5000/
