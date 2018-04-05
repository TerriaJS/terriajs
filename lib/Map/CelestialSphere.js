const Texture = require('terriajs-cesium/Source/Renderer/Texture');
const defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
const DrawCommand = require('terriajs-cesium/Source/Renderer/DrawCommand');
const Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
const Sampler = require('terriajs-cesium/Source/Renderer/Sampler');
const PixelFormat = require('terriajs-cesium/Source/Core/PixelFormat');
const SphereGeometry = require('terriajs-cesium/Source/Core/SphereGeometry');
const VertexFormat = require('terriajs-cesium/Source/Core/VertexFormat');
const BlendingState = require('terriajs-cesium/Source/Scene/BlendingState');
const RenderState = require('terriajs-cesium/Source/Renderer/RenderState');
const ShaderProgram = require('terriajs-cesium/Source/Renderer/ShaderProgram');
const BufferUsage = require('terriajs-cesium/Source/Renderer/BufferUsage');
const loadImage = require('terriajs-cesium/Source/Core/loadImage');
const defined = require('terriajs-cesium/Source/Core/defined');
const GeometryPipeline = require('terriajs-cesium/Source/Core/GeometryPipeline');
const VertexArray = require('terriajs-cesium/Source/Renderer/VertexArray');
const TextureMinificationFilter = require('terriajs-cesium/Source/Renderer/TextureMinificationFilter');
const TextureMagnificationFilter = require('terriajs-cesium/Source/Renderer/TextureMagnificationFilter');

const CelestialSphereVS = `
attribute vec3 position;
attribute vec2 st;

varying vec2 v_texCoord;

void main()
{
    vec3 p = czm_viewRotation * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
    gl_Position = czm_projection * vec4(p, 1.0);
    //vec3 normal = normalize(position);
    v_texCoord = st; //clamp(vec2(atan(normal.y, normal.x) / czm_twoPi + 0.5, asin(normal.z) / czm_pi + 0.5), 0.0, 1.0);
}
`;

const CelestialSphereFS = `
uniform sampler2D u_texture;

varying vec2 v_texCoord;

void main()
{
    //gl_FragColor = vec4(v_texCoord.x, 0.0, 0.0, 1.0);
    gl_FragColor = texture2D(u_texture, v_texCoord);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

/**
 * A sky box around the scene to draw stars.  The sky box is defined using the True Equator Mean Equinox (TEME) axes.
 * <p>
 * This is only supported in 3D.  The sky box is faded out when morphing to 2D or Columbus view.  The size of
 * the sky box must not exceed {@link Scene#maximumCubeMapSize}.
 * </p>
 *
 * @alias SkyBox
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} [options.sources] The source URL or <code>Image</code> object for each of the six cube map faces.  See the example below.
 * @param {Boolean} [options.show=true] Determines if this primitive will be shown.
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBox({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function CelestialSphere(options) {
    /**
     * The sources used to create the cube map faces: an object
     * with <code>positiveX</code>, <code>negativeX</code>, <code>positiveY</code>,
     * <code>negativeY</code>, <code>positiveZ</code>, and <code>negativeZ</code> properties.
     * These can be either URLs or <code>Image</code> objects.
     *
     * @type Object
     * @default undefined
     */
    this.image = options.image;
    this._image = undefined;

    /**
     * Determines if the sky box will be shown.
     *
     * @type {Boolean}
     * @default true
     */
    this.show = defaultValue(options.show, true);

    this._command = new DrawCommand({
        modelMatrix : Matrix4.clone(Matrix4.IDENTITY),
        owner : this
    });
    this._texture = undefined;
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {DeveloperError} this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.
 * @exception {DeveloperError} this.sources properties must all be the same type.
 */
CelestialSphere.prototype.update = function(frameState) {
    var that = this;

    if (!this.show) {
        return undefined;
    }

    // if ((frameState.mode !== SceneMode.SCENE3D) &&
    //     (frameState.mode !== SceneMode.MORPHING)) {
    //     return undefined;
    // }

    // The sky box is only rendered during the render pass; it is not pickable, it doesn't cast shadows, etc.
    if (!frameState.passes.render) {
        return undefined;
    }

    var context = frameState.context;

    if (this._image !== this.image) {
        this._image = this.image;
        var image = this.image;

        loadImage(image).then(image => {
            var sampler = new Sampler({
                minificationFilter : TextureMinificationFilter.NEAREST,
                magnificationFilter : TextureMagnificationFilter.NEAREST
            });

            this._texture = this._texture && this._texture.destroy();
            this._texture = new Texture({
                context: context,
                source: image,
                pixelFormat: PixelFormat.RGBA,
                sampler: sampler
            });
        });
    }

    var command = this._command;

    if (!defined(command.vertexArray)) {
        command.uniformMap = {
            u_texture: function() {
                return that._texture;
            }
        };

        var geometry = SphereGeometry.createGeometry(new SphereGeometry({
            radius: 1.0,
            vertexFormat: VertexFormat.POSITION_AND_ST
        }));

        var attributeLocations = GeometryPipeline.createAttributeLocations(geometry);

        command.vertexArray = VertexArray.fromGeometry({
            context : context,
            geometry : geometry,
            attributeLocations : attributeLocations,
            bufferUsage : BufferUsage.STATIC_DRAW
        });

        command.shaderProgram = ShaderProgram.fromCache({
            context : context,
            vertexShaderSource : CelestialSphereVS,
            fragmentShaderSource : CelestialSphereFS,
            attributeLocations : attributeLocations
        });

        command.renderState = RenderState.fromCache({
            blending : BlendingState.ALPHA_BLEND
        });
    }

    if (!defined(this._texture)) {
        return undefined;
    }

    return command;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
 *
 * @see SkyBox#destroy
 */
CelestialSphere.prototype.isDestroyed = function() {
    return false;
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * skyBox = skyBox && skyBox.destroy();
 *
 * @see SkyBox#isDestroyed
 */
CelestialSphere.prototype.destroy = function() {
    var command = this._command;
    command.vertexArray = command.vertexArray && command.vertexArray.destroy();
    command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy();
    this._texture = this._texture && this._texture.destroy();
    return destroyObject(this);
};

module.exports = CelestialSphere;
