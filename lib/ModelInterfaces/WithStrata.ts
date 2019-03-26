import StratumFromTraits from "../Models/StratumFromTraits";

export default interface WithStrata<Traits> {
    getOrCreateStratum(id: string): StratumFromTraits<Traits>;
}
