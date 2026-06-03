import { IReactionDisposer, reaction, untracked } from "mobx";
import isDefined from "../Core/isDefined";
import { TerriaConfig } from "./TerriaConfig";
import { LocalStorage } from "../Core/LocalStorage";
import z from "zod";

const stringToNumber = z.codec(z.string().regex(z.regexes.number), z.number(), {
  decode: (str) => Number.parseFloat(str),
  encode: (num) => num.toString()
});

const stringToBoolean = z.codec(z.string().or(z.boolean()), z.boolean(), {
  decode: (str) => {
    if (typeof str === "boolean") {
      return str;
    }
    return str.toLowerCase() === "true";
  },
  encode: (bool) => bool.toString()
});

export const PERSISTED_SETTINGS_SCHEMA = z.object({
  viewermode: z.enum(["2d", "3d", "3dsmooth"]).optional(),
  basemap: z.string().optional(),
  useNativeResolution: stringToBoolean.optional(),
  baseMaximumScreenSpaceError: stringToNumber.optional(),
  shortenShareUrls: stringToBoolean.optional()
});

export type StorageAdapter = {
  getItem: (key: string) => boolean | string | null;
  setItem: (key: string, value: boolean | number | string) => void;
};

export interface IPersistedSettingsSevice<
  TConfig extends TerriaConfig = TerriaConfig
> {
  read<T extends keyof z.input<typeof PERSISTED_SETTINGS_SCHEMA>>(
    key: T
  ): z.output<typeof PERSISTED_SETTINGS_SCHEMA>[T] | undefined;
  mapToConfigParams(): Partial<TConfig>;
  initConfigSync(): IReactionDisposer[];
}

export class PersistedSettingsService<
  TConfig extends TerriaConfig = TerriaConfig
> implements IPersistedSettingsSevice<TConfig> {
  constructor(
    private readonly config: TConfig,
    private readonly adapter: StorageAdapter = new LocalStorage(
      untracked(() => config.appName)
    )
  ) {}

  read<T extends keyof z.input<typeof PERSISTED_SETTINGS_SCHEMA>>(
    key: T
  ): z.output<typeof PERSISTED_SETTINGS_SCHEMA>[T] | undefined {
    const raw = this.adapter.getItem(key);

    const parsed = PERSISTED_SETTINGS_SCHEMA.safeDecode({ [key]: raw });

    if (parsed.success) {
      return parsed.data[key];
    }

    return undefined;
  }

  mapToConfigParams(): Partial<TConfig> {
    const raw = {
      useNativeResolution:
        this.adapter.getItem("useNativeResolution") ?? undefined,
      baseMaximumScreenSpaceError: (this.adapter.getItem(
        "baseMaximumScreenSpaceError"
      ) ?? undefined) as string,
      shortenShareUrls: this.adapter.getItem("shortenShareUrls") ?? undefined
    };
    return PERSISTED_SETTINGS_SCHEMA.decode(raw) as Partial<TConfig>;
  }

  initConfigSync(): IReactionDisposer[] {
    const disposer = reaction(
      () =>
        [
          this.config.useNativeResolution,
          this.config.baseMaximumScreenSpaceError,
          this.config.shortenShareUrls
        ] as const,
      ([
        useNativeResolution,
        baseMaximumScreenSpaceError,
        shortenShareUrls
      ]) => {
        const encoded = PERSISTED_SETTINGS_SCHEMA.encode({
          useNativeResolution: useNativeResolution,
          baseMaximumScreenSpaceError: baseMaximumScreenSpaceError,
          shortenShareUrls: shortenShareUrls
        });
        this.syncFromConfig(encoded);
      }
    );

    return [disposer];
  }

  protected syncFromConfig(
    config: z.input<typeof PERSISTED_SETTINGS_SCHEMA>
  ): void {
    if (isDefined(config.useNativeResolution)) {
      this.adapter.setItem("useNativeResolution", config.useNativeResolution);
    }
    if (isDefined(config.baseMaximumScreenSpaceError)) {
      this.adapter.setItem(
        "baseMaximumScreenSpaceError",
        config.baseMaximumScreenSpaceError
      );
    }
    if (isDefined(config.shortenShareUrls)) {
      this.adapter.setItem("shortenShareUrls", config.shortenShareUrls);
    }
  }
}
