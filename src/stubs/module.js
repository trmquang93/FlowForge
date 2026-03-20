// Browser stub for Node "module" builtin.
// Used by fflate (bundled in @grida/refig) to optionally load worker_threads.
export function createRequire() {
  return () => ({});
}
