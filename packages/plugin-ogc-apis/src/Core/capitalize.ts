export default function capitalize(str: string): string {
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}`;
}
