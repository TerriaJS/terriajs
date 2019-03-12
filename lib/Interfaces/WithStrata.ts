import { ObservableMap } from "mobx";

export default interface WithStrata<Traits> {
    //readonly strata: ObservableMap<string, Partial<Traits>>;
    getOrCreateStratum(id: string): Partial<Traits>;
}
