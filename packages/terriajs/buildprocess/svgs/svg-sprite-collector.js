/**
 * Singleton collector for SVG icons
 * Shared between the loader and plugin
 */
class SvgSpriteCollector {
  constructor() {
    this.iconsByNamespace = new Map();
    this.isProcessed = false;
    this.hasNewIcons = false; // Track if any icons were added this build
  }

  /**
   * Register an SVG icon from the loader
   */
  addIcon(namespace, iconId, iconData) {
    this.hasNewIcons = true; // Mark that we have new icons this build

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
   * Check if any new icons were added this build cycle
   */
  hasChanges() {
    return this.hasNewIcons;
  }

  markAsProcessed() {
    this.isProcessed = true;
    this.hasNewIcons = false; // Reset for next build
  }

  /**
   * Reset collector (for watch mode)
   */
  reset() {
    this.iconsByNamespace.clear();
    this.isProcessed = false;
    this.hasNewIcons = false; // Reset the flag
  }
}

// Export singleton instance
const collector = new SvgSpriteCollector();
module.exports = collector;
