const Terria = require('../dist/Models/Terria').default;
const registerCatalogMembers = require('../dist/Models/registerCatalogMembers').default;
const CatalogMemberFactory = require('../dist/Models/CatalogMemberFactory').default;

// import { PrimitiveArrayTrait } from './../src/Traits/primitiveArrayTrait';
// import { PrimitiveTrait } from './../src/Traits/primitiveTrait';
// import { ObjectArrayTrait } from './../src/Traits/objectArrayTrait';
// import { ObjectTrait } from './../src/Traits/objectTrait';

// function markdownFromTraitType(trait) {
//     let base = '';
//     if (trait instanceof PrimitiveTrait || trait instanceof PrimitiveArrayTrait) {
//       base = trait.type;
//     } else if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait ) {
//       base = 'object';
//     }
//     if (trait instanceof PrimitiveArrayTrait || trait instanceof ObjectArrayTrait) {
//       return base + '[]';
//     } else {
//       return base;
//     }
// }
  
// function visitObjectTraitProperties(objectTrait, callback, depth=0) {
//     Object.entries(objectTrait.type.traits).forEach(([k, trait]) => {
//         callback(k, trait, depth);
//         if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait) {
//         visitObjectTraitProperties(trait, callback, depth+1);
//         }
//     });
// }
  
// function markdownFromObjectTrait(objectTrait) {
//     const lines = ['_Properties_:'];
//     const callback = (name, trait, depth) => {
//         let spaces = '';
//         for (let i = 0; i < depth; i++) {
//         spaces += '    ';
//         }
//         let line1 = spaces + '* `' + name + '`';
//         const traitType = markdownFromTraitType(trait);
//         if (traitType) {
//         line1 += ': **' + traitType + '**';
//         }
//         const description = trait.description.replace(/\n/g, '\r').replace(/\r+\s+/g, '\r' + spaces);

//         lines.push(line1 + ', ' + description);
//     };
//     visitObjectTraitProperties(objectTrait, callback);
//     return lines;
// }

registerCatalogMembers();
const terria = new Terria()
console.log(CatalogMemberFactory)
// // catalogMembers.forEach(m => {
// //     const Member = require(`terriajs/lib/Models/${m}.ts`).default;

// //     let content = '!!! note\r\r' +
// //         '    This page is automatically generated from the source code, and is a bit rough.  If you have\r' +
// //         '    trouble, check the [source code for this type](https://github.com/TerriaJS/terriajs/blob/mobx/lib/Models/' + m + '.ts) or post a message to the [forum](https://groups.google.com/forum/#!forum/terriajs).\r\r';
// //     content += '## [Initialization File](../../customizing/initialization-files.md) properties:\r\r';
// //     content += '`"type": "' + Member.type + '"`\r\r';

// //     Object.entries(Member.traits).forEach(([k, trait]) => {
// //         content += '\r\r-----\r\r';
// //         content += '`' + k + '`';
// //         const traitType = markdownFromTraitType(trait);
// //         if (traitType) {
// //         content += ': **' + traitType + '**';
// //         }
// //         content += '\r\r';
// //         content += trait.description + '\r\r';
// //         if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait ) {
// //         content += markdownFromObjectTrait(trait).join('\r\r') + '\r\r';
// //         }
// //     });
// //     models.file(`${Member.type}.md`, content);
// //     console.log(content);
// // });