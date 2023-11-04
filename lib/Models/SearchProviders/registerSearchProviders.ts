import AustralianGazetteerSearchProvider from "./AustralianGazetteerSearchProvider";
import BingMapsSearchProvider from "./BingMapsSearchProvider";
import SearchProviderFactory from "./SearchProviderFactory";

export default function registerSearchProviders() {
  SearchProviderFactory.register(
    BingMapsSearchProvider.type,
    BingMapsSearchProvider
  );

  SearchProviderFactory.register(
    AustralianGazetteerSearchProvider.type,
    AustralianGazetteerSearchProvider
  );
}
