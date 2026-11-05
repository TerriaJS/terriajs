// React Aria's virtualizer reads process.env, which browsers don't have, as the
// design system's tests also provide
globalThis.process ??= { env: {} } as unknown as NodeJS.Process;
