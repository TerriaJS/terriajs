const SVGSpriter = require("svg-sprite");
const collector = require("./svg-sprite-collector");
const { sources } = require("webpack");
const { basename, join } = require("path");
const crypto = require("crypto");
const fs = require("fs");

/**
 * SVG Sprite Webpack Plugin
 * Hooks into compilation, accesses collector, compiles sprite sheet, and emits sprite.svg
 */
class SvgSpriteWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      ...options,
      debug: options.debug || false
    };

    this.sprites = new Map();
    this.spritesPaths = new Set();
  }

  apply(compiler) {
    console.log("🔨 Initializing SVG Sprite Webpack Plugin...");
    compiler.hooks.thisCompilation.tap(
      SvgSpriteWebpackPlugin.name,
      (compilation) => {
        // Hook into finishModules to process after all modules are loaded
        compilation.hooks.finishModules.tapPromise(
          {
            name: "SvgSpriteWebpackPlugin",
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
          },
          async () => {
            try {
              // Check if any SVG files changed this build
              if (!collector.hasChanges()) {
                console.log(
                  "⏭️  Skipping sprite compilation - no SVG changes detected"
                );
                return;
              }
              console.log("🔨 Compiling SVG sprites...");

              await this.processIcons(compilation);
            } catch (error) {
              console.error("❌ Failed to build SVG sprite:", error);
              throw error;
            }
          }
        );

        compilation.hooks.processAssets.tap(
          {
            name: SvgSpriteWebpackPlugin.name,
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
          },
          () => {
            const script = this.generateInjectionScript();

            const { sources } = compiler.webpack;

            compilation.emitAsset(
              "svg-sprite.js",
              new sources.RawSource(script)
            );

            const mainChunk = compilation.namedChunks.get("main");
            if (mainChunk) {
              mainChunk.files.add("svg-sprite.js");
            }

            console.log("✅ Generate svg sprite injection script");
          }
        );
      }
    );
  }

  generateInjectionScript() {
    let source = `const existingContainer = document.getElementById("svg-sprites") ?? document.body;

function injectSprites() {`;

    this.sprites.forEach((svgContent, namespace) => {
      const div = `div_${namespace.replace(/[^a-zA-Z0-9_]/g, "_")}`;

      source += `
  // Append SVG sprite: ${namespace}
  const ${div} = document.createElement('div');
  ${div}.style.display = 'none';
  ${div}.innerHTML = \`${svgContent}\`;
  existingContainer.appendChild(${div});
`;
    });

    source += `}

function init() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }
  injectSprites();
}

init();`;

    return source;
  }

  async processIcons(compilation) {
    this.cleanupOldSpriteFiles(Array.from(this.spritesPaths), compilation);

    this.sprites.clear();
    this.spritesPaths.clear();

    const iconsByNamespace = collector.getIconsByNamespace();

    for (const [namespace, icons] of Object.entries(iconsByNamespace)) {
      console.log(
        `🔨 Processing ${icons.size} SVG icons for sprite ${namespace}...`
      );

      const sprite = await this.buildSprite(
        namespace,
        icons,
        this.options.outputPath
      );

      // Register sprite in global registry with content
      this.sprites.set(namespace, sprite.content);

      if (this.options.debug) {
        // Emit sprite file for debugging
        compilation.emitAsset(
          sprite.filename,
          new sources.RawSource(sprite.content)
        );
        this.spritesPaths.add(compilation.getPath(sprite.filename));
      }

      console.log(
        `✅ Generated sprite for ${namespace} with ${icons.size} icons`
      );
    }

    collector.markAsProcessed();
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

  /**
   * Generate custom hash for sprite content
   */
  generateSpriteHash(content, namespace) {
    const hash = crypto.createHash("md5");
    hash.update(content);
    hash.update(namespace);

    return hash.digest("hex").substring(0, 8);
  }

  /**
   * Clean up old sprite files from previous builds in watch mode
   */
  cleanupOldSpriteFiles(previousSpritePaths, compilation) {
    if (!previousSpritePaths || previousSpritePaths.length === 0) {
      return;
    }
    console.log("🧹 Cleaning up old sprite files...");

    previousSpritePaths.forEach((filePath) => {
      const path = join(compilation.outputOptions.path, filePath);
      try {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
          console.log(`🗑️  Cleaned up old sprite file: ${basename(path)}`);
        }
      } catch (error) {
        console.warn(
          `⚠️  Failed to delete old sprite file ${basename(path)}:`,
          error.message
        );
      }
    });
  }
}

module.exports = SvgSpriteWebpackPlugin;
