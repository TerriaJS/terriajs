'use strict';

var defined = require('terriajs-cesium/Source/Core/defined');
var Ray = require('terriajs-cesium/Source/Core/Ray');
var IntersectionTests = require('terriajs-cesium/Source/Core/IntersectionTests');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Tween = require('terriajs-cesium/Source/ThirdParty/Tween');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');


var ZoomControl = React.createClass({

    flyToPosition: function(scene, position, durationMilliseconds){
    var camera = scene.camera;
    var startPosition = camera.position;
    var endPosition = position;

    //temp
    durationMilliseconds = 200;

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
            scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
            scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);
        },
        complete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        },
        cancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        }
    });
    },

    getCameraFocus: function(scene){
      var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
      var intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
      if (defined(intersections)) {
          return Ray.getPoint(ray, intersections.start);
      } else {
          // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
          // the focal point.
          return IntersectionTests.grazingAltitudeLocation(ray, Ellipsoid.WGS84);
      }
    },

    zoomIn: function(){
      var cartesian3Scratch = new Cartesian3();
      this.props.terria.analytics.logEvent('navigation', 'click', 'zoomIn');

      if (defined(this.props.terria.leaflet)) {
           this.props.terria.leaflet.map.zoomIn(1);
      }

      if (defined(this.props.terria.cesium)) {
          var scene =  this.props.terria.cesium.scene;
          var camera = scene.camera;
          var focus = this.getCameraFocus(scene);
          var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
          var movementVector = Cartesian3.multiplyByScalar(direction, 2.0 / 3.0, cartesian3Scratch);
          var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);
          this.flyToPosition(scene, endPosition);
      }

       this.props.terria.currentViewer.notifyRepaintRequired();
    },

    zoomOut: function(){
      var cartesian3Scratch = new Cartesian3();
      this.props.terria.analytics.logEvent('navigation', 'click', 'zoomOut');

      if (defined( this.props.terria.leaflet)) {
           this.props.terria.leaflet.map.zoomOut(1);
      }

      if (defined( this.props.terria.cesium)) {
          var scene =  this.props.terria.cesium.scene;
          var camera = scene.camera;
          var focus = this.getCameraFocus(scene);
          var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
          var movementVector = Cartesian3.multiplyByScalar(direction, -2.0, cartesian3Scratch);
          var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);
          this.flyToPosition(scene, endPosition);
      }
       this.props.terria.currentViewer.notifyRepaintRequired();
    },

    zoomReset: function(){

    },

    render: function() {
        return (<div className='zoom-control'>
          <ul className='list-reset'>
          <li><button onClick={this.zoomIn} className='btn zoom-increarse' title='zoom in'><i className='icon icon-zoom-in'></i></button></li>
          <li><button onClick={this.zoomReset} className='btn zoom-decrease' title='reset zoom'><i className='icon icon-refresh'></i></button></li>
          <li><button onClick={this.zoomOut} className='btn zoom-decrease' title='zoom out'><i className='icon icon-zoom-out'></i></button></li>
          </ul></div>);
    }
});
module.exports = ZoomControl;
