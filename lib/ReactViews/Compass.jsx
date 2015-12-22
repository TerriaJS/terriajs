'use strict';
var React = require('react');
var CameraFlightPath = require('terriajs-cesium/Source/Scene/CameraFlightPath');
var Cartesian2 = require('terriajs-cesium/Source/Core/Cartesian2');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var getTimestamp = require('terriajs-cesium/Source/Core/getTimestamp');
var Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
var Ray = require('terriajs-cesium/Source/Core/Ray');
var Transforms = require('terriajs-cesium/Source/Core/Transforms');

// the compass on map
var Compass = React.createClass({
    propTypes: {
        terria : React.PropTypes.object
    },

    getInitialState: function() {
        return {
            orbitCursorAngle: 0,
            heading: 0.0,
            orbitCursorOpacity: 0
        };
    },

    componentDidMount: function(){
      //this.props.terria.afterViewerChanged.addEventListener(viewerChange);
      viewerChange(this);
    },

    handleMouseDown: function(e){
      var compassElement = e.currentTarget;
      var compassRectangle = e.currentTarget.getBoundingClientRect();
      var maxDistance = compassRectangle.width / 2.0;
      var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
      var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
      var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
      var distanceFromCenter = Cartesian2.magnitude(vector);

      var distanceFraction = distanceFromCenter / maxDistance;

      var nominalTotalRadius = 145;
      var norminalGyroRadius = 50;

      if (distanceFraction < norminalGyroRadius / nominalTotalRadius) {
        orbit(this, compassElement, vector);
      } else if (distanceFraction < 1.0) {
        rotate(this, compassElement, vector);
      } else {
        return true;
      }
    },
    handleDoubleClick: function(e) {
        var scene =  this.props.terria.cesium.scene;
        var camera = scene.camera;

        var windowPosition = windowPositionScratch;
        windowPosition.x = scene.canvas.clientWidth / 2;
        windowPosition.y = scene.canvas.clientHeight / 2;
        var ray = camera.getPickRay(windowPosition, pickRayScratch);

        var center = scene.globe.pick(ray, scene, centerScratch);
        if (!defined(center)) {
            // Globe is barely visible, so reset to home view.
            this.props.terria.currentViewer.zoomTo( this.props.terria.homeView, 1.5);
            return;
        }

        var rotateFrame = Transforms.eastNorthUpToFixedFrame(center, Ellipsoid.WGS84);

        var lookVector = Cartesian3.subtract(center, camera.position, new Cartesian3());

        var flight = CameraFlightPath.createTween(scene, {
            destination: Matrix4.multiplyByPoint(rotateFrame, new Cartesian3(0.0, 0.0, Cartesian3.magnitude(lookVector)), new Cartesian3()),
            direction: Matrix4.multiplyByPointAsVector(rotateFrame, new Cartesian3(0.0, 0.0, -1.0), new Cartesian3()),
            up: Matrix4.multiplyByPointAsVector(rotateFrame, new Cartesian3(0.0, 1.0, 0.0), new Cartesian3()),
            duration: 1.5
        });
        scene.tweens.add(flight);
    },

    resetRotater: function(){
      this.setState({
        orbitCursorOpacity: 0,
        orbitCursorAngle: 0
      });
    },



    render: function() {

      var rotationMarkerStyle = {
          transform : 'rotate(-' + this.state.orbitCursorAngle + 'rad)',
          WebkitTransform : 'rotate(-' + this.state.orbitCursorAngle + 'rad)',
          opacity: this.state.orbitCursorOpacity
        },

        outerCircleStyle = {
          transform : 'rotate(-' + this.state.heading + 'rad)',
          WebkitTransform : 'rotate(-' + this.state.heading + 'rad)',
          opacity: ''
        };

        return (
            <div className='compass' onMouseDown ={this.handleMouseDown} onDoubleClick ={this.handleDoubleClick} onMouseUp ={this.resetRotater}>
              <div className='compass-outer-ring' style={outerCircleStyle}></div>
              <div className='compass-inner-ring' title='Click and drag to rotate the camera'></div>
              <div className='compass-rotation-marker' style={rotationMarkerStyle}></div>
            </div>
          );
    }
});

var vectorScratch = new Cartesian2();
var oldTransformScratch = new Matrix4();
var newTransformScratch = new Matrix4();
var centerScratch = new Cartesian3();
var windowPositionScratch = new Cartesian2();
var pickRayScratch = new Ray();

function rotate(viewModel, compassElement, cursorVector) {
    // Remove existing event handlers, if any.
    document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
    document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

    viewModel.rotateMouseMoveFunction = undefined;
    viewModel.rotateMouseUpFunction = undefined;

    viewModel.isRotating = true;
    viewModel.rotateInitialCursorAngle = Math.atan2(-cursorVector.y, cursorVector.x);

    var scene = viewModel.props.terria.cesium.scene;

    var camera = scene.camera;

    var windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    var ray = camera.getPickRay(windowPosition, pickRayScratch);

    var viewCenter = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(viewCenter)) {
        viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(camera.positionWC, Ellipsoid.WGS84, newTransformScratch);
        viewModel.rotateIsLook = true;
    } else {
        viewModel.rotateFrame = Transforms.eastNorthUpToFixedFrame(viewCenter, Ellipsoid.WGS84, newTransformScratch);
        viewModel.rotateIsLook = false;
    }

    var oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
    camera.lookAtTransform(viewModel.rotateFrame);
    viewModel.rotateInitialCameraAngle = Math.atan2(camera.position.y, camera.position.x);
    viewModel.rotateInitialCameraDistance = Cartesian3.magnitude(new Cartesian3(camera.position.x, camera.position.y, 0.0));
    camera.lookAtTransform(oldTransform);

    viewModel.rotateMouseMoveFunction = function(e) {
        var compassRectangle = compassElement.getBoundingClientRect();
        var center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
        var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
        var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
        var angle = Math.atan2(-vector.y, vector.x);

        var angleDifference = angle - viewModel.rotateInitialCursorAngle;
        var newCameraAngle = CesiumMath.zeroToTwoPi(viewModel.rotateInitialCameraAngle - angleDifference);

        camera = viewModel.props.terria.cesium.scene.camera;

        oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);
        camera.lookAtTransform(viewModel.rotateFrame);
        var currentCameraAngle = Math.atan2(camera.position.y, camera.position.x);
        camera.rotateRight(newCameraAngle - currentCameraAngle);
        camera.lookAtTransform(oldTransform);

        viewModel.props.terria.cesium.notifyRepaintRequired();
    };

    viewModel.rotateMouseUpFunction = function(e) {
        viewModel.isRotating = false;
        document.removeEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.rotateMouseUpFunction, false);

        viewModel.rotateMouseMoveFunction = undefined;
        viewModel.rotateMouseUpFunction = undefined;
    };

    document.addEventListener('mousemove', viewModel.rotateMouseMoveFunction, false);
    document.addEventListener('mouseup', viewModel.rotateMouseUpFunction, false);
}

function orbit(viewModel, compassElement, cursorVector) {
    // Remove existing event handlers, if any.
    document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
    document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

    if (defined(viewModel.orbitTickFunction)) {
        viewModel.props.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
    }

    viewModel.orbitMouseMoveFunction = undefined;
    viewModel.orbitMouseUpFunction = undefined;
    viewModel.orbitTickFunction = undefined;

    viewModel.isOrbiting = true;
    viewModel.orbitLastTimestamp = getTimestamp();

    var scene = viewModel.props.terria.cesium.scene;
    var camera = scene.camera;

    var windowPosition = windowPositionScratch;
    windowPosition.x = scene.canvas.clientWidth / 2;
    windowPosition.y = scene.canvas.clientHeight / 2;
    var ray = camera.getPickRay(windowPosition, pickRayScratch);

    var center = scene.globe.pick(ray, scene, centerScratch);
    if (!defined(center)) {
        viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(camera.positionWC, Ellipsoid.WGS84, newTransformScratch);
        viewModel.orbitIsLook = true;
    } else {
        viewModel.orbitFrame = Transforms.eastNorthUpToFixedFrame(center, Ellipsoid.WGS84, newTransformScratch);
        viewModel.orbitIsLook = false;
    }

    viewModel.orbitTickFunction = function(e) {
        var timestamp = getTimestamp();
        var deltaT = timestamp - viewModel.orbitLastTimestamp;
        var rate = (viewModel.state.orbitCursorOpacity - 0.5) * 2.5 / 1000;
        var distance = deltaT * rate;

        var angle = viewModel.state.orbitCursorAngle + CesiumMath.PI_OVER_TWO;
        var x = Math.cos(angle) * distance;
        var y = Math.sin(angle) * distance;

        scene = viewModel.props.terria.cesium.scene;
        camera = scene.camera;

        var oldTransform = Matrix4.clone(camera.transform, oldTransformScratch);

        camera.lookAtTransform(viewModel.orbitFrame);

        if (viewModel.orbitIsLook) {
            camera.look(Cartesian3.UNIT_Z, -x);
            camera.look(camera.right, -y);
        } else {
            camera.rotateLeft(x);
            camera.rotateUp(y);
        }

        camera.lookAtTransform(oldTransform);

        viewModel.props.terria.cesium.notifyRepaintRequired();

        viewModel.orbitLastTimestamp = timestamp;
    };

    function updateAngleAndOpacity(vector, compassWidth) {
        var angle = Math.atan2(-vector.y, vector.x);
        viewModel.setState({
          orbitCursorAngle : CesiumMath.zeroToTwoPi(angle - CesiumMath.PI_OVER_TWO)
        });

        var distance = Cartesian2.magnitude(vector);
        var maxDistance = compassWidth / 2.0;
        var distanceFraction = Math.min(distance / maxDistance, 1.0);
        var easedOpacity = 0.5 * distanceFraction * distanceFraction + 0.5;
        viewModel.setState({
          orbitCursorOpacity : easedOpacity
        });

        viewModel.props.terria.cesium.notifyRepaintRequired();
    }

    viewModel.orbitMouseMoveFunction = function(e) {
        var compassRectangle = compassElement.getBoundingClientRect();
        center = new Cartesian2((compassRectangle.right - compassRectangle.left) / 2.0, (compassRectangle.bottom - compassRectangle.top) / 2.0);
        var clickLocation = new Cartesian2(e.clientX - compassRectangle.left, e.clientY - compassRectangle.top);
        var vector = Cartesian2.subtract(clickLocation, center, vectorScratch);
        updateAngleAndOpacity(vector, compassRectangle.width);
    };

    viewModel.orbitMouseUpFunction = function(e) {
        // TODO: if mouse didn't move, reset view to looking down, north is up?

        viewModel.isOrbiting = false;
        document.removeEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
        document.removeEventListener('mouseup', viewModel.orbitMouseUpFunction, false);

        if (defined(viewModel.orbitTickFunction)) {
            viewModel.props.terria.clock.onTick.removeEventListener(viewModel.orbitTickFunction);
        }

        viewModel.orbitMouseMoveFunction = undefined;
        viewModel.orbitMouseUpFunction = undefined;
        viewModel.orbitTickFunction = undefined;
    };

    document.addEventListener('mousemove', viewModel.orbitMouseMoveFunction, false);
    document.addEventListener('mouseup', viewModel.orbitMouseUpFunction, false);
    viewModel.props.terria.clock.onTick.addEventListener(viewModel.orbitTickFunction);

    updateAngleAndOpacity(cursorVector, compassElement.getBoundingClientRect().width);
}

function viewerChange(viewModel) {
    if (defined(viewModel.props.terria.cesium)) {
        if (viewModel._unsubcribeFromPostRender) {
            viewModel._unsubcribeFromPostRender();
            viewModel._unsubcribeFromPostRender = undefined;
        }

        viewModel._unsubcribeFromPostRender =  viewModel.props.terria.cesium.scene.postRender.addEventListener(function() {
            viewModel.setState({
              heading: viewModel.props.terria.cesium.scene.camera.heading
            });
        });
    } else {
        if (viewModel._unsubcribeFromPostRender) {
            viewModel._unsubcribeFromPostRender();
            viewModel._unsubcribeFromPostRender = undefined;
        }
        viewModel.showCompass = false;
    }
}

module.exports = Compass;
