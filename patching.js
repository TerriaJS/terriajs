// null -> remove value
// patch
// any other value -> replace

// In underride
{
    "legends": [
        {
            "url": "https://example.com/a.png"
        },
        {
            "url": "https://example.com/b.png"
        }
    ]
}

// In definition
{
    "legends": {
        "modify": [
            {
                "op": "add",
                "addBefore": 0,
                "value": ""
            }
        ]
    }
}


// Primitives:
// - new value (replace)
// - null -> delete value (make it now undefined)

// Objects:
// - new value (replace)
// - null -> delete value (make it now undefined)
// - merge -> each property is applied in turn
const o = {
    "someObject": {
        "replace": true,
        "someProperty": "newValue",
        "removeThisProperty": null,
        "nestedObjectToReplace": {
            "replace": true,
            "something": "thing"
        },
        "nestedObjectToMerge": {
            "etc": "whatever"
        }
    }
};

// Arrays:
// - new value (replace)
// - null -> delete value (make it now undefined)
// - select element by property value and merge

// JSON:
// - JSONPatch

const a = {
    "someArray": [
        {
            // Replace all elements with nothing, i.e. clear the array.
            // Only the first element can do this.
            "replace": true
        },
        {
            // Delete (replace with nothing) an element that has a particular value for a particular trait
            "trait": "traitToSelectBy",
            "traitValue": "traitValueToSelect",
            "replace": true
        },
        {
            // Replace an element that has a particular value for a particular trait
            "trait": "traitToSelectBy",
            "traitValue": "traitValueToSelect",
            "replace": true,
            "someTrait": "newValue",
            "another": true
        },
        {
            // Merge an element that has a particular value for a particular trait
            "trait": "traitToSelectBy",
            "traitValue": "traitValueToSelect",
            "someTrait": "newValue",
            "another": true
        }
    ]
    // {
    //     "modify": [
    //         {
    //             "trait": "traitToSelectBy",
    //             "traitValue": "traitValueToSelect",
    //             "replace": null // remove it
    //         },
    //         {
    //             "trait": "traitToSelectBy",
    //             "traitValue": "differentValue",
    //             "replace": { // entirely new value for this object in the array
    //                 "someProperty": "value",
    //                 "another": true
    //             }
    //         },
    //         {
    //             "trait": "traitToSelectBy",
    //             "traitValue": "thirdValue",
    //             "merge": { // merge this object with the existing one in the array
    //                 "someProperty": "newValue"
    //             }
    //         }
    //     ]
    // }
}
{
    "op": "merge",
    "value": 
}