import SummaryConceptModel from '../Map/SummaryConcept';

function getConceptsForCategory(concepts) {
    // SB: so we have an array of data-things (categories?), each of which contains an array of DisplayVariablesConcepts,
    // each containing an array of Concepts. Is this an array too many?

    // CC: yes it is, but that's the structure. each category comes from a dataset, and each dataset can have array of DisplayVariablesConcepts,
    // and each DisplayVariablesConcepts have multiple concept (X, Y, etc), when displayed in workbench, it was attatched to the dataset, but when displayed
    // in chart panel, because they are displayed at the last configurable level, they needs to be flattened and made available, hence this code
    const displayConcepts = [];
    function getConcepts(concepts) {
        function extractDisplayConcepts(concepts, categoryName = '') {
            if (!concepts.isVisible || SummaryConceptModel.prototype.isPrototypeOf(concepts)) {
              return;
            }
            if (concepts.activeItems) {
                concepts.items.map(c => extractDisplayConcepts(c, concepts.categoryName));
            } else {
                const displayConcept = concepts;
                displayConcept.categoryName = categoryName;
                displayConcepts.push(displayConcept);
            }
        }

        if (concepts && concepts.length > 0) {
            return concepts.forEach(c => extractDisplayConcepts(c, concepts.categoryName));
        }
    }
    concepts.forEach(getConcepts);

    return displayConcepts;
}

module.exports = getConceptsForCategory;
