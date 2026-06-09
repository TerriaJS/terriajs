export function xml(text: string) {
  return new DOMParser().parseFromString(text, "application/xml");
}
