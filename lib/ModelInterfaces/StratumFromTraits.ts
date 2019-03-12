import ModelTraits from "../Traits/ModelTraits";
import OrUndefined from "../Core/OrUndefined";

type StratumFromTraits<TDefinition extends ModelTraits> = OrUndefined<Required<TDefinition>>;

export default StratumFromTraits;

