require('jsdom-global')()
global.XMLHttpRequest = window.XMLHttpRequest
XMLHttpRequest = window.XMLHttpRequest
global.DOMParser = window.DOMParser;
global.fetch = require('node-fetch');

import Bottleneck from "bottleneck";
import * as fse from "fs-extra";
import TerriaError from "../lib/Core/TerriaError";
import { getName } from "../lib/ModelMixins/CatalogMemberMixin";
import GroupMixin from "../lib/ModelMixins/GroupMixin";
import ReferenceMixin from "../lib/ModelMixins/ReferenceMixin";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import SdmxCatalogGroup from "../lib/Models/Catalog/SdmxJson/SdmxJsonCatalogGroup";
import { BaseModel } from "../lib/Models/Definition/Model";
import Terria from "../lib/Models/Terria";

export default async function generateCatalogIndex(argv: string[]) {
  const [configUrl] = argv.slice(2);

  if (!configUrl) {
    console.error(`\nUSAGE: node ./build/generateCatalogIndex.js <config-url>\n`);
    process.exit(1);
  }

  console.log(`Config URL: ${configUrl}`);

  interface CatalogIndex {
    [id: string]: {
      name: string;
      knownContainerUniqueIds: string[];
    };
  }

  // Load 10 concurrent requests per second
  const limiter = new Bottleneck({
    maxConcurrent: 10,
    minTime: 100
  });

  async function loadMember(terria: Terria, member: BaseModel) {
    if (member.type === SdmxCatalogGroup.type) return

    let name = getName(member)
    if (ReferenceMixin.isMixedInto(member)) {
      try {
        await limiter.schedule({ expiration: 10000 }, async () => {
          console.log(`Loading Reference ${name}`);
          (await (member as ReferenceMixin.Instance).loadReference()).logError(`FAILED to load Reference ${name}`)

        })
      } catch (timeout) {
        console.error(`TIMEOUT FAILED to load Reference ${name} `);
      }

      if (member.target)
        member = member.target
      name = getName(member)
    }
    if (GroupMixin.isMixedInto(member)) {
      console.log(`Loading Group ${name}`);
      try {
        await limiter.schedule({ expiration: 10000 }, async () => {
          console.log(`Loading Group ${name}`);
          (await (member as GroupMixin.Instance).loadMembers()).logError(`FAILED to load GROUP ${name}`)

        })
      } catch (timeout) {
        console.error(`TIMEOUT FAILED to load GROUP ${name} `);
      }

      await Promise.all(
        member.memberModels.map((child) => {
          return loadMember(terria, child);
        })
      );
    }
  }

  function indexModel(member: BaseModel, index: CatalogIndex = {}) {
    let knownContainerUniqueIds = member.knownContainerUniqueIds
    if (ReferenceMixin.isMixedInto(member) && member.target) {
      knownContainerUniqueIds = Array.from(new Set([...member.knownContainerUniqueIds, ...member.target.knownContainerUniqueIds]))
      member = member.target
    }
    if (member.uniqueId && member.uniqueId !== "/" && member.uniqueId !== "__User-Added_Data__") {
      index[member.uniqueId] = {
        name: getName(member),
        knownContainerUniqueIds,
      };
    }
    if (GroupMixin.isMixedInto(member)) {
      member.memberModels.forEach((childMember) =>
        indexModel(childMember, index)
      );
    }

    return index;
  }


  const terriaOptions = {
    baseUrl: "build/TerriaJS",
  };

  const terria = new Terria(terriaOptions);

  registerCatalogMembers();

  try {

    await terria.start({ configUrl })

    await terria.loadInitSources();
  } catch (e) {
    console.error(TerriaError.from(e, `Failed to initialise Terria`).toError());
  }

  await loadMember(terria, terria.catalog.group);

  const index = indexModel(terria.catalog.group);

  fse.writeFileSync("catalog-index.json", JSON.stringify(index));
}

generateCatalogIndex(process.argv);
