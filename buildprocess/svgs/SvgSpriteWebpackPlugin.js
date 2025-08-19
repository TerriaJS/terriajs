const SVGSpriter = require("svg-sprite");
const collector = require("./svg-sprite-collector");
const { sources } = require("webpack");
const { basename, join } = require("path");
const crypto = require("crypto");

/**
 * SVG Sprite Webpack Plugin
 * Hooks into compilation, accesses collector, compiles sprite sheet, and emits sprite.svg
 */
class SvgSpriteWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      outputPath: "build/",
      ...options
    };

    this.sprites = new Map();
    this.spritesPaths = new Set();
  }

  /**
   * Generate custom hash for sprite content
   */
  generateSpriteHash(content, namespace) {
    const hash = crypto.createHash("md5");
    hash.update(content);
    hash.update(namespace);

    return hash.digest("hex").substring(0, 8);
  }

  apply(compiler) {
    console.log("🔨 Initializing SVG Sprite Webpack Plugin...");
    compiler.hooks.thisCompilation.tap(
      SvgSpriteWebpackPlugin.name,
      (compilation) => {
        console.log("🔨 Compiling SVG sprites...");
        this.sprites.clear();
        this.spritesPaths.clear();
        // Hook into finishModules to process after all modules are loaded
        compilation.hooks.finishModules.tapPromise(
          {
            name: "SvgSpriteWebpackPlugin",
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
          },
          async () => {
            try {
              const iconsByNamespace = collector.getIconsByNamespace();

              for (const [namespace, icons] of Object.entries(
                iconsByNamespace
              )) {
                console.log(
                  `🔨 Processing ${icons.size} SVG icons for sprite ${namespace}...`
                );

                const sprite = await this.buildSprite(
                  namespace,
                  icons,
                  this.options.outputPath
                );

                // Build sprite from collected icons
                compilation.emitAsset(
                  sprite.filename,
                  new sources.RawSource(sprite.content)
                );
                // Register sprite in global registry with content
                this.sprites.set(sprite.filename, sprite.content);
                this.spritesPaths.add(
                  join(this.options.outputPath, sprite.filename)
                );

                console.log(
                  `✅ Generated ${sprite.filename} with ${icons.size} icons`
                );
              }

              // Generate sprite manifest for runtime loading
              const spriteManifest = {
                sprites: Array.from(this.spritesPaths),
                generated: new Date().toISOString()
              };

              compilation.emitAsset(
                "sprite-manifest.json",
                new sources.RawSource(JSON.stringify(spriteManifest, null, 2))
              );

              console.log("✅ Generated sprite-manifest.json");
            } catch (error) {
              console.error("❌ Failed to build SVG sprite:", error);
              throw error;
            }
          }
        );

        // No need for combined loader generation anymore - sprites are injected directly into HTML

        // Hook into HtmlWebpackPlugin at the compiler level
        if (compiler.hooks.compilation) {
          compiler.hooks.compilation.tap(
            SvgSpriteWebpackPlugin.name,
            (compilation) => {
              // Check if HtmlWebpackPlugin is present
              const HtmlWebpackPlugin = compiler.options.plugins?.find(
                (plugin) => plugin.constructor.name === "HtmlWebpackPlugin"
              );

              if (HtmlWebpackPlugin && HtmlWebpackPlugin.constructor.getHooks) {
                const hooks =
                  HtmlWebpackPlugin.constructor.getHooks(compilation);
                // Hook before HTML generation to add sprite data
                if (hooks.beforeAssetTagGeneration) {
                  hooks.beforeAssetTagGeneration.tapAsync(
                    SvgSpriteWebpackPlugin.name,
                    (data, callback) => {
                      // Add sprite information to template parameters
                      if (!data.plugin.options) {
                        data.plugin.options = {};
                      }
                      data.plugin.options.sprites = Object.fromEntries(
                        this.sprites.entries()
                      );
                      data.plugin.options.spritesPaths = Array.from(
                        this.spritesPaths
                      );
                      callback(null, data);
                    }
                  );
                }
              }
            }
          );
        }
      }
    );

    // Reset collector and registry on watch mode rebuilds
    if (compiler.options.watch) {
      compiler.hooks.watchRun.tap(SvgSpriteWebpackPlugin.name, () => {
        collector.reset();
        this.sprites.clear();
      });
    }
  }

  /**
   * Build SVG sprite from collected icons
   */
  async buildSprite(namespace, icons, dest = "") {
    const spriter = new SVGSpriter({
      mode: {
        symbol: {
          inline: true,
          dest,
          sprite: `sprite-${namespace}`,
          bust: false
        }
      },
      svg: {
        xmlDeclaration: false,
        doctypeDeclaration: false
      },
      shape: {
        id: {
          generator: (svg) => {
            const name = basename(svg.replace(/\s+/g, "_"), ".svg");
            return `${namespace}-${name}`;
          }
        },
        transform: [
          {
            svgo: {
              plugins: [{ name: "preset-default" }, "removeXMLNS"]
            }
          }
        ]
      }
    });

    // Add all collected icons to the spriter
    for (const [_iconId, iconData] of icons) {
      const name = basename(iconData.path, ".svg");
      spriter.add(iconData.path, `${name}.svg`, iconData.content);
    }

    const { result } = await spriter.compileAsync();
    const spriteContent = result.symbol.sprite.contents.toString();

    // Generate our custom hash
    const customHash = this.generateSpriteHash(spriteContent, namespace);
    const customFilename = `sprite-${namespace}-${customHash}.svg`;

    return {
      content: spriteContent,
      filename: customFilename
    };
  }
}

module.exports = SvgSpriteWebpackPlugin;
