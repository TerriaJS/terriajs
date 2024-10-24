import AustralianGazetteerSearchProvider from "./AustralianGazetteerSearchProvider";
import BingMapsSearchProvider from "./BingMapsSearchProvider";
import CesiumIonSearchProvider from "./CesiumIonSearchProvider";
import RerSearchProvider from "./RerSearchProvider";
import SearchProviderFactory from "./SearchProviderFactory";

export default function registerSearchProviders() {
  SearchProviderFactory.register(
    BingMapsSearchProvider.type,
    BingMapsSearchProvider
  );

  SearchProviderFactory.register(RerSearchProvider.type, RerSearchProvider);

  SearchProviderFactory.register(
    CesiumIonSearchProvider.type,
    CesiumIonSearchProvider
  );

  SearchProviderFactory.register(
    AustralianGazetteerSearchProvider.type,
    AustralianGazetteerSearchProvider
  );
}
