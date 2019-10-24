import "urijs/src/URITemplate";

declare global {
  namespace uri {
    interface URITemplate {
      expression: string;
    }
  }
}
