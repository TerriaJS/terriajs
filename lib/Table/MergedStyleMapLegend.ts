import { computed, makeObservable } from "mobx";
import isDefined from "../Core/isDefined";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum, {
  LockedDownStratum
} from "../Models/Definition/LoadableStratum";
import { BaseModel } from "../Models/Definition/Model";
import StratumFromTraits from "../Models/Definition/StratumFromTraits";
import LegendTraits, {
  LegendItemTraits
} from "../Traits/TraitsClasses/LegendTraits";

/** Merge all legend items in legends - by legend.title */
export class MergedStyleMapLegend
  extends LoadableStratum(LegendTraits)
  implements LockedDownStratum<LegendTraits, MergedStyleMapLegend>
{
  constructor(
    private readonly legends: StratumFromTraits<LegendTraits>[],
    private readonly legendItemOverrides: Partial<LegendItemTraits> = {}
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(_newModel: BaseModel): this {
    return new MergedStyleMapLegend(this.legends) as this;
  }

  @computed get title() {
    return this.legends.find((l) => l.title)?.title;
  }

  @computed
  get items(): StratumFromTraits<LegendItemTraits>[] {
    const items: StratumFromTraits<LegendItemTraits>[] = [];

    // Merge all Legend items by title
    this.legends.forEach((legend) => {
      legend.items?.forEach((currentItem) => {
        const existingItemIndex = items.findIndex(
          (item) => item.title && item.title === currentItem.title
        );
        const existingItem = items[existingItemIndex];
        if (!existingItem) {
          items.push(
            createStratumInstance(LegendItemTraits, {
              ...this.legendItemOverrides,
              ...currentItem
            })
          );
        } else {
          items[existingItemIndex] = {
            ...this.legendItemOverrides,
            ...existingItem,
            ...Object.entries(currentItem).reduce<Partial<LegendItemTraits>>(
              (acc, [key, value]) => {
                if (isDefined(value)) {
                  acc[key as keyof LegendItemTraits] = value as any;
                }
                return acc;
              },
              {}
            )
          };
        }
      });
    });

    return items;
  }
}
