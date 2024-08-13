import RollbarErrorServiceProvider from "./RollbarErrorServiceProvider";
import StubErrorServiceProvider from "./StubErrorServiceProvider";
import SearchProviderFactory from "./SearchProviderFactory";
import ErrorServiceProviderFactory from "./ErrorServiceProviderFactory";

export default function registerErrorServiceProviders() {
  ErrorServiceProviderFactory.register(
    RollbarErrorServiceProvider.type,
    RollbarErrorServiceProvider
  );

  ErrorServiceProviderFactory.register(
    StubErrorServiceProvider.type,
    StubErrorServiceProvider
  );
}
