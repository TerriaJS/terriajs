import StratumFromTraits from "./StratumFromTraits";

export default interface WithStrata<Traits> {
    getOrCreateStratum(id: string): StratumFromTraits<Traits>;
}
