/**
 * Singleton collector for SVG icons
 * Shared between the loader and plugin
 */
class SvgSpriteCollector {
  constructor() {
    this.iconsByNamespace = new Map();
    this.isProcessed = false;
  }

  /**
   * Register an SVG icon from the loader
   */
  addIcon(namespace, iconId, iconData) {
    if (this.iconsByNamespace.has(namespace)) {
      this.iconsByNamespace.get(namespace).set(iconId, iconData);
    } else {
      const namespaceMap = new Map();
      namespaceMap.set(iconId, iconData);
      this.iconsByNamespace.set(namespace, namespaceMap);
    }
  }

  /**
   * Get all registered icons
   */
  getIconsByNamespace() {
    return Object.fromEntries(this.iconsByNamespace.entries());
  }

  /**
   * Reset collector (for watch mode)
   */
  reset() {
    this.iconsByNamespace.clear();
    this.isProcessed = false;
  }
}

// Export singleton instance
const collector = new SvgSpriteCollector();
module.exports = collector;
