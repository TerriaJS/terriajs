import Bottleneck from "bottleneck";
import * as fse from "fs-extra";
import filterOutUndefined from "../lib/Core/filterOutUndefined";
import TerriaError from "../lib/Core/TerriaError";
import CatalogMemberMixin, { getName } from "../lib/ModelMixins/CatalogMemberMixin";
import GroupMixin from "../lib/ModelMixins/GroupMixin";
import MappableMixin from "../lib/ModelMixins/MappableMixin";
import ReferenceMixin from "../lib/ModelMixins/ReferenceMixin";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import { BaseModel } from "../lib/Models/Definition/Model";
import { CatalogIndex } from "../lib/Models/SearchProviders/CatalogSearchProvider";
import Terria from "../lib/Models/Terria";

export default async function generateCatalogIndex(argv: string[]) {
  const [configUrl] = argv.slice(2);

  if (!configUrl) {
    console.error(`\nUSAGE: node ./build/generateCatalogIndex.js <config-url>\n`);
    process.exit(1);
  }

  require('jsdom-global')(undefined, {
    url: 'https://beta.nationalmap.terria.io'
  })
  global.XMLHttpRequest = window.XMLHttpRequest
  XMLHttpRequest = window.XMLHttpRequest
  global.DOMParser = window.DOMParser;
  global.fetch = require('node-fetch');

  console.log(`Config URL: ${configUrl}`);

  // Load 10 concurrent requests per second
  const limiter = new Bottleneck({
    maxConcurrent: 10,
    minTime: 100
  });

  const errors:TerriaError[] = []

  function getPath(terria: Terria, member: BaseModel | undefined): string {
    return filterOutUndefined([...[member?.knownContainerUniqueIds.map(id => getPath(terria, terria.getModelById(BaseModel, id)))].reverse(), member?.uniqueId]).join("/")
  }

  async function loadMember(terria: Terria, member: BaseModel) {
    let name = getName(member)
    let path = getPath(terria, member)
    if (ReferenceMixin.isMixedInto(member)) {
      try {
        // Timeout after 30 seconds
        await limiter.schedule({ expiration: 30000 }, async () => {
          console.log(`Loading Reference ${name} (${path})`);
          const result = (await (member as ReferenceMixin.Instance).loadReference())
          result.logError(`FAILED to load Reference ${name} (${path})`)
          result.pushErrorTo(errors, `FAILED to load Reference ${name} (${path})`)
        })
      } catch (timeout) {
        errors.push(TerriaError.from(`TIMEOUT FAILED to load Reference ${name}  (${path})`))
        console.error(`TIMEOUT FAILED to load Reference ${name}`);
      }

      if (member.target)
        member = member.target
      name = getName(member)
    }
    if (GroupMixin.isMixedInto(member)) {
      console.log(`Loading Group ${name}`);
      try {
        await limiter.schedule({ expiration: 10000 }, async () => {
          console.log(`Loading Group ${name} (${path})`);
          const result = (await (member as GroupMixin.Instance).loadMembers())
          result.logError(`FAILED to load GROUP ${name} (${path})`)
          result.pushErrorTo(errors, `FAILED to load GROUP ${name} (${path})`)
        })
      } catch (timeout) {
        errors.push(TerriaError.from(`TIMEOUT FAILED to load GROUP ${name} (${path})`))
        console.error(`TIMEOUT FAILED to load GROUP ${name} (${path})`);
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
        description: CatalogMemberMixin.isMixedInto(member) ? member.description : undefined,
        memberKnownContainerUniqueIds: knownContainerUniqueIds,
        isGroup: GroupMixin.isMixedInto(member),
        isMappable: MappableMixin.isMixedInto(member)
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
    terria.configParameters.serverConfigUrl = "https://beta.nationalmap.terria.io/serverconfig"
    terria.configParameters.corsProxyBaseUrl = "https://beta.nationalmap.terria.io/proxy/"
    await terria.start({ configUrl })

    await terria.loadInitSources();
  } catch (e) {
    console.error(TerriaError.from(e, `Failed to initialise Terria`).toError());
  }

  await loadMember(terria, terria.catalog.group);

  const index = indexModel(terria.catalog.group);

  fse.writeFileSync("catalog-index.json", JSON.stringify(index));

  const terriaError = TerriaError.combine(errors, "Errors")?.toError()

  if (terriaError?.stack)
    fse.writeFileSync("catalog-index-errors.json", terriaError.stack);
}

generateCatalogIndex(process.argv);
