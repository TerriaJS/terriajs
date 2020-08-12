import registerCatalogMembers from '../lib/Models/registerCatalogMembers';
import CatalogMemberFactory from '../lib/Models/CatalogMemberFactory';
import documentation from 'documentation';
 
import { PrimitiveArrayTrait } from '../lib/Traits/primitiveArrayTrait';
import { PrimitiveTrait } from '../lib/Traits/primitiveTrait';
import { ObjectArrayTrait } from '../lib/Traits/objectArrayTrait';
import { ObjectTrait } from '../lib/Traits/objectTrait';
import fs from 'fs';

registerCatalogMembers();
const catalogMembers = Array.from(CatalogMemberFactory.constructors)


function markdownFromTraitType(trait) {
    let base = '';
    if (trait instanceof PrimitiveTrait || trait instanceof PrimitiveArrayTrait) {
      base = trait.type;
    } else if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait ) {
      base = 'object';
    }
    if (trait instanceof PrimitiveArrayTrait || trait instanceof ObjectArrayTrait) {
      return base + '[]';
    } else {
      return base;
    }
}
  
function visitObjectTraitProperties(objectTrait, callback, depth=0) {
    Object.entries(objectTrait.type.traits).forEach(([k, trait]) => {
        callback(k, trait, depth);
        if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait) {
          visitObjectTraitProperties(trait, callback, depth+1);
        }
    });
}
  
function markdownFromObjectTrait(objectTrait, traitKey, sampleMember) {

    let out = `
### ${objectTrait.name}
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
`
    const callback = (name, trait, depth) => {
        const traitType = markdownFromTraitType(trait);
        const description = trait.description.replace(/\n/g, '\r').replace(/\r+\s+/g, '\r');
        const defaultValue = sampleMember[traitKey][name] === undefined ? '' : sampleMember[traitKey][name]
        out += `| ${name} | **${traitType}** | ${defaultValue} | ${description} |
`
    };
    if (objectTrait instanceof ObjectTrait || objectTrait instanceof ObjectArrayTrait) {
        visitObjectTraitProperties(objectTrait, callback);
    }
    return out;
}

async function getJsDoc (memberName) {
    return new Promise(function(resolve) {
        documentation.build([`./lib/Models/${memberName}.ts`], {
            shallow: true
        }).then(documentation.formats.json)
        .then(output => {
            resolve(JSON.parse(output))
        })
    })
}

async function processMember (member) {
    const sampleMember = new member()
    const memberName = sampleMember.constructor.name
    let description = '';
    let example = '';
    if (memberName === 'Cesium3DTilesCatalogItem') {
        const jsDocJson = await getJsDoc(memberName)
        description = jsDocJson[0].description.children[0].children[0].value.replace(/\n/g, '');;
        example = jsDocJson[0].examples[0].description;
    }

    let content = `
${description}

## Example usage
\`\`\`\`json
${example}
\`\`\`\`

## Properties

"type": "${member.type}"
`

content += `
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
`

let additionalContent = ` 
`
;
    Object.entries(member.traits).forEach(([k, trait]) => {
        const traitType = markdownFromTraitType(trait);
        if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait ) {
            additionalContent += markdownFromObjectTrait(trait, k, sampleMember);
            content += `| ${k} | **${traitType}** - see below | | ${trait.description} - see below |
`
        } else {
            const defaultValue = sampleMember[k] === undefined ? '' : sampleMember[k]
            content += `| ${k} | **${traitType}** | ${defaultValue} | ${trait.description} |
`
        }
    });

    return [content, additionalContent].join('');
}

async function processArray(catalogMembers) {
    for (const m of catalogMembers) {
        const member = m[1];
        const content = await processMember(member);
        fs.writeFileSync(`outputdocs/${member.type}.md`, content)
    };
}
processArray(catalogMembers)