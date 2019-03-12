import Model from "../Models/Model";

export default interface WithStrata<Traits> {
    getOrCreateStratum(id: string): Model.StratumFromTraits<Traits>;
}
