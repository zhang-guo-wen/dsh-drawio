//#region src/index.ts
/**
* Host half. The preview is entirely browser-side, so this contributes nothing
* to the host plugin tree; it exists because the Loader resolves a plugin row by
* package name and imports this entry.
*/
/** Host plugin body: registers no host service, tool, or prompt section. */
function apply() {}
//#endregion
export { apply };
