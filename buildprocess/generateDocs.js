import documentation from "documentation";
import fs from "fs";
import YAML from "yaml";
import CatalogMemberFactory from "../lib/Models/CatalogMemberFactory";
import registerCatalogMembers from "../lib/Models/registerCatalogMembers";
import { ObjectArrayTrait } from "../lib/Traits/objectArrayTrait";
import { ObjectTrait } from "../lib/Traits/objectTrait";
import { PrimitiveArrayTrait } from "../lib/Traits/primitiveArrayTrait";
import { PrimitiveTrait } from "../lib/Traits/primitiveTrait";

// Run with cwd = /build
// Gets /build/doc/mkdocs.yml (which is a direct copy of /doc/mkdocs.yml)
//  adds all of the auto-generated pages and writes out to /build/mkdocs.yml

registerCatalogMembers();
const catalogMembers = Array.from(CatalogMemberFactory.constructors);

const members = catalogMembers
  .map(member => {
    const memberName = member[1];
    return new memberName();
  }, this)
  .sort(function(a, b) {
    if (a.constructor.name < b.constructor.name) return -1;
    else if (a.constructor.name > b.constructor.name) return 1;
    return 0;
  });

const mkDocsConfig = YAML.parse(fs.readFileSync("doc/mkdocs.yml", "utf8"));
const items = [];

function markdownFromTraitType(trait) {
  let base = "";
  if (trait instanceof PrimitiveTrait || trait instanceof PrimitiveArrayTrait) {
    base = trait.type;
  } else if (
    trait instanceof ObjectTrait ||
    trait instanceof ObjectArrayTrait
  ) {
    base = "object";
  }
  if (
    trait instanceof PrimitiveArrayTrait ||
    trait instanceof ObjectArrayTrait
  ) {
    return base + "[]";
  } else {
    return base;
  }
}

function visitObjectTraitProperties(objectTrait, callback, depth = 0) {
  Object.entries(objectTrait.type.traits).forEach(([k, trait]) => {
    callback(k, trait, depth);
    if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait) {
      visitObjectTraitProperties(trait, callback, depth + 1);
    }
  });
}

function markdownFromObjectTrait(objectTrait, traitKey, sampleMember) {
  let out = `
### ${objectTrait.name}
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
`;
  const callback = (name, trait, depth) => {
    const traitType = markdownFromTraitType(trait);
    const description = trait.description
      .replace(/\n/g, "\r")
      .replace(/\r+\s+/g, "\r");
    const defaultValue =
      sampleMember[traitKey][name] === undefined
        ? ""
        : sampleMember[traitKey][name];
    out += `| ${name} | **${traitType}** | ${defaultValue} | ${description} |
`;
  };
  if (
    objectTrait instanceof ObjectTrait ||
    objectTrait instanceof ObjectArrayTrait
  ) {
    visitObjectTraitProperties(objectTrait, callback);
  }
  return out;
}

function getDescription(metadata) {
  return concatTags(metadata, true);
}

function concatTags(inNode) {
  if (!inNode) return false;
  let outDescr = inNode.map(node => {
    return node.value;
  });
  outDescr = outDescr.join(" ").replace(" .", ".");
  if (outDescr === "Optional parameters")
    outDescr = outDescr.concat(": see below");
  return outDescr;
}

async function getJsDoc(memberName) {
  return new Promise(function(resolve) {
    documentation
      .build([`./lib/Traits/${memberName}Traits.ts`], {
        shallow: true
      })
      .then(documentation.formats.json)
      .then(output => {
        resolve(JSON.parse(output));
      })
      .catch(err => {
        console.log(`${memberName}: ${err}`);
      });
  });
}

async function processMember(sampleMember, memberName) {
  let description = "";
  let example = "";

  const jsDocJson = await getJsDoc(memberName);

  if (jsDocJson[0]) {
    if (jsDocJson[0].description) {
      description = getDescription(
        jsDocJson[0].description.children[0].children
      );
    }
    if (jsDocJson[0].examples[0]) {
      example = `## Example usage
\`\`\`\`json
${jsDocJson[0].examples[0].description}
\`\`\`\`
`;
    }
  }

  let content = `${description}
${example}

## Properties

"type": "${sampleMember.type}"
`;

  content += `
| Trait | Type | Default | Description |
| ------ | ------ | ------ | ------ |
`;

  let additionalContent = `
`;
  Object.entries(sampleMember.traits).forEach(([k, trait]) => {
    const traitType = markdownFromTraitType(trait);
    if (trait instanceof ObjectTrait || trait instanceof ObjectArrayTrait) {
      additionalContent += markdownFromObjectTrait(trait, k, sampleMember);
      content += `| ${k} | **${traitType}** <br> see below | | ${trait.description} |
`;
    } else {
      const defaultValue =
        sampleMember[k] === undefined || k === "currentTime"
          ? ""
          : sampleMember[k];
      content += `| ${k} | **${traitType}** | ${defaultValue} | ${trait.description} |
`;
    }
  });

  return [content, additionalContent].join("");
}

let catalogItemsContent = `A Catalog Item is a dataset or service that can be enabled for display on the map or in a chart.  The Type column in the table below indicates the \`"type"\` property to use in the [Initialization File](../customizing/initialization-files.md).

| Name | Type |
|------|------|
`;

let catalogGroupsContent = `A Catalog Group is a folder in the TerriaJS catalog that contains [Catalog Items](catalog-items.md), [Catalog Functions](catalog-functions.md), and other groups. The Type column in the table below indicates the \`"type"\` property to use in the [Initialization File](../customizing/initialization-files.md).

| Name | Type |
|------|------|
`;

async function processArray() {
  for (let i = 0; i < members.length; i++) {
    const sampleMember = members[i];
    const memberName = sampleMember.constructor.name;

    console.log(memberName, sampleMember.type);
    if (memberName.indexOf("Item") > -1) {
      catalogItemsContent += `| [${memberName}](catalog-type-details/${sampleMember.type}.md) | \`${sampleMember.type}\` |
`;
    } else {
      catalogGroupsContent += `| [${memberName}](catalog-type-details/${sampleMember.type}.md) | \`${sampleMember.type}\` |
`;
    }
    const out = {};
    out[
      memberName
    ] = `connecting-to-data/catalog-type-details/${sampleMember.type}.md`;
    items.push(out);
    const content = await processMember(sampleMember, memberName);
    fs.writeFileSync(
      `doc/connecting-to-data/catalog-type-details/${sampleMember.type}.md`,
      content
    );
  }
  mkDocsConfig.nav[3]["Connecting to Data"][6]["Catalog Type Details"] = items;

  fs.writeFileSync("mkdocs.yml", YAML.stringify(mkDocsConfig));
  fs.writeFileSync(
    "doc/connecting-to-data/catalog-items.md",
    catalogItemsContent
  );
  fs.writeFileSync(
    "doc/connecting-to-data/catalog-groups.md",
    catalogGroupsContent
  );
}
processArray();
