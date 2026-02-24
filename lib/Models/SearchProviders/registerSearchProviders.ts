import AustralianGazetteerSearchProvider from "./AustralianGazetteerSearchProvider";
import BingMapsSearchProvider from "./BingMapsSearchProvider";
import CesiumIonSearchProvider from "./CesiumIonSearchProvider";
import MapboxSearchProvider from "./MapboxSearchProvider";
import NominatimSearchProvider from "./NominatimSearchProvider";
import SearchProviderFactory from "./SearchProviderFactory";

export default function registerSearchProviders() {
  SearchProviderFactory.register(
    BingMapsSearchProvider.type,
    BingMapsSearchProvider
  );

  SearchProviderFactory.register(
    CesiumIonSearchProvider.type,
    CesiumIonSearchProvider
  );

  SearchProviderFactory.register(
    NominatimSearchProvider.type,
    NominatimSearchProvider
  );

  SearchProviderFactory.register(
    AustralianGazetteerSearchProvider.type,
    AustralianGazetteerSearchProvider
  );

  SearchProviderFactory.register(
    MapboxSearchProvider.type,
    MapboxSearchProvider
  );
}
