"use strict";

/*global require*/
var naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;

var AbsCode = require("./AbsCode");
var inherit = require("../Core/inherit");
var Concept = require("../Map/Concept");
/**
 * Represents an ABS concept associated with a AbsDataset.
 * An AbsConcept contains an array one of more AbsCodes.
 *
 * @alias AbsConcept
 * @constructor
 * @extends Concept
 * @param {Object} [options] Object with the following properties:
 * @param {String} [options.name] The concept's human-readable name, eg. "Region Type".
 * @param {String[]} [options.id] The concept's id (the name given to it by the ABS), eg. "REGIONTYPE".
 * @param {Object[]} [options.codes] ABS code objects describing a tree of codes under this concept,
 *        eg. [{code: '01_02', description: 'Negative/Nil Income', parentCode: 'TOT', parentDescription: 'Total'}, ...].
 * @param {String[]} [options.filter] The initial concepts and codes to activate.
 * @param {Boolean} [options.allowMultiple] Does this concept only allow multiple active children (eg. all except Region type)?
 * @param {Function} [options.activeItemsChangedCallback] A function called when activeItems changes.
 */
var AbsConcept = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  Concept.call(this, options.name || options.id);

  /**
   * Gets or sets the name of the concept item.  This property is observable.
   * @type {String}
   */
  this.id = options.id;

  /**
   * Gets the list of absCodes contained in this group.  This property is observable.
   * @type {AbsConcept[]}
   */
  this.items = [];

  /**
   * Gets or sets a value indicating whether this concept item is currently open.  When an
   * item is open, its child items (if any) are visible.  This property is observable.
   * @type {Boolean}
   */
  this.isOpen = true;

  /**
   * Flag to say if this if this node is selectable.  This property is observable.
   * @type {Boolean}
   */
  this.isSelectable = false;

  /**
   * Flag to say if this if this concept only allows more than one active child. (Defaults to false.)
   * @type {Boolean}
   */
  this.allowMultiple = defaultValue(options.allowMultiple, false);

  if (defined(options.codes)) {
    var anyActive = buildConceptTree(this, options.filter, this, options.codes);
    // If no codes were made active via the 'filter' parameter, activate the first one.
    if (!anyActive && this.items.length > 0) {
      this.items[0].isActive = true;
    }
  }

  knockout.track(this, ["items", "isOpen"]); // name, isSelectable already tracked by Concept

  // Returns a flat array of all the active AbsCodes under this concept (walking the tree).
  // For this calculation, a concept may be active independently of its children.
  knockout.defineProperty(this, "activeItems", {
    get: function() {
      return getActiveChildren(this);
    }
  });

  knockout.getObservable(this, "activeItems").subscribe(function(activeItems) {
    options.activeItemsChangedCallback(this, activeItems);
  }, this);
};

inherit(Concept, AbsConcept);

Object.defineProperties(AbsConcept.prototype, {
  /**
   * Gets a value indicating whether this item has child items.
   * @type {Boolean}
   */
  hasChildren: {
    get: function() {
      return this.items.length > 0;
    }
  }
});

/**
 * Toggles the {@link AbsConcept#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
AbsConcept.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

/**
 * Finds all the active children and recodes them as a 'filter', eg. ['REGION.SA2', 'MEASURE.A02']
 * @return {String[]} The active children as a filter.
 */
AbsConcept.prototype.toFilter = function() {
  var activeChildren = getActiveChildren(this);
  return activeChildren.map(function(child) {
    return child.concept.id + "." + child.code;
  });
};

function getActiveChildren(concept) {
  if (!defined(concept)) {
    return;
  }
  var result = [];
  concept.items.forEach(function(child) {
    if (child.isActive) {
      result.push(child);
    }
    result = result.concat(getActiveChildren(child));
  });
  return result;
}

// Recursively builds out the AbsCodes underneath this AbsConcept.
// Returns true if any codes were made active, false if none.
function buildConceptTree(parent, filter, concept, codes) {
  // Use natural sort for fields with included ages or incomes.
  codes.sort(function(a, b) {
    return naturalSort(
      a.description.replace(",", ""),
      b.description.replace(",", "")
    );
  });
  var anyActive = false;
  for (var i = 0; i < codes.length; ++i) {
    var parentCode = parent instanceof AbsCode ? parent.code : "";
    if (codes[i].parentCode === parentCode) {
      var absCode = new AbsCode(codes[i].code, codes[i].description, concept);
      var codeFilter = concept.id + "." + absCode.code;
      if (defined(filter) && filter.indexOf(codeFilter) !== -1) {
        absCode.isActive = true;
        anyActive = true;
      }
      if (parentCode === "" && codes.length < 50) {
        absCode.isOpen = true;
      }
      absCode.parent = parent;
      parent.items.push(absCode);
      var anyChildrenActive = buildConceptTree(absCode, filter, concept, codes);
      anyActive = anyChildrenActive || anyActive;
    }
  }
  return anyActive;
}

module.exports = AbsConcept;
