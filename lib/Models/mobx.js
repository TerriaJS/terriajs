const mst = require('mobx-state-tree');
const mobx = require('mobx');

const defined = x => typeof x !== 'undefined';
const optional = type => mst.types.optional(mst.types.union(type, mst.types.undefined), undefined);

const CatalogMemberDefinition = mst.types.model('CatalogMemberDefinition', {
    name: optional(mst.types.string),
    description: optional(mst.types.string)
});

const CatalogItemDefinition = CatalogMemberDefinition.named('CatalogItemDefinition').props({
    url: optional(mst.types.string)
});

const CatalogMember = createModelType('CatalogMember', CatalogItemDefinition, [], {
    name: 'Unnamed Item',
    description: ''
});

let AnyCatalogMember;

const CatalogGroupDefinition = CatalogMemberDefinition.named('CatalogGroupDefinition').props({
    items: optional(mst.types.array(mst.types.reference(mst.types.late(() => AnyCatalogMember))))
});

function createPropertySetActions(self, definitionType, middleLayerNames) {
    const setters = {};
    Object.keys(definitionType.properties).forEach(property => {
        setters['_set_' + property] = function(value) {
            self.user[property] = value;
        };
    });
    return setters;
}

function createPropertyViews(self, definitionType, middleLayerNames) {
    const views = {};
    Object.keys(definitionType.properties).forEach(property => {
        Object.defineProperty(views, property, {
            get: function() {
                if (defined(self.user[property])) {
                    return self.user[property];
                }

                for (let i = 0; i < middleLayerNames.length; ++i) {
                    const middleLayerName = middleLayerNames[i];
                    const middleLayer = self[middleLayerName];
                    if (defined(middleLayer) && defined(middleLayer[property])) {
                        return middleLayer[property];
                    }
                }

                return defined(self.definition[property]) ? self.definition[property] : self.default[property];
            },
            set: function(value) {
                self['_set_' + property](value);
            },
            enumerable: true
        });
    });
    return views;
}

function createModelType(name, definitionType, middleLayerNames, defaults) {
    const layers = {
        type: name,
        id: mst.types.identifier(mst.types.string),
        default: mst.types.optional(definitionType, defaults),
        definition: mst.types.optional(CatalogItemDefinition, {}),
        user: mst.types.optional(CatalogItemDefinition, {})
    };

    middleLayerNames.forEach(layerName => {
        layers[layerName] = mst.types.optional(CatalogItemDefinition, {});
    });

    const withLayers = mst.types.model(name, layers);
    const withActions = withLayers.actions(self => createPropertySetActions(self, definitionType, middleLayerNames));
    const withViews = withActions.views(self => createPropertyViews(self, definitionType, middleLayerNames));
    return withViews;
}

const CatalogItem = createModelType('CatalogItem', CatalogItemDefinition, ['load'], {
    name: 'Unnamed Item',
    description: '',
    url: ''
}).actions(self => ({
    doThings() {
        self.name = 'hi';
        self.description = 'bye';
        self.url = 'http://example.com';
    }
}));

const CatalogGroup = createModelType('CatalogGroup', CatalogGroupDefinition, [], {
    items: []
}).actions(self => ({
    addItem(item) {
        self.items.push(item);
    },
    addItems(items) {
        self.items.push(...items);
    }
}));


AnyCatalogMember = mst.types.union(CatalogMember, CatalogItem, CatalogGroup);

const g = CatalogGroup.create({ id: 'a' });

const newItems = [];
for (let i = 0; i < 10000; ++i) {
    newItems.push(CatalogItem.create({ id: i.toString() }));
}

//g.addItems(newItems);

const m = CatalogItem.create({ id: 'c' });

// mobx.autorun(r => {
//     console.log(m.name);
// });

// mst.onPatch(m, newSnapshot => {
//     console.dir(newSnapshot);
// });

console.log(m.name);
console.log(m.name);
console.log(m.name);

m.name = 'foo';
console.log(m.name);
console.log(m.name);
console.log(m.name);
m.doThings();
console.log(m.name);
console.log(m.description);
console.log(m.url);
