// Adapted from https://stackoverflow.com/a/27746324

export default function isPromise(obj: unknown): obj is Promise<unknown> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "then" in obj &&
    typeof (obj as any).then === "function"
  );
}
