import { Plugin } from "@opencode/plugin"

/**
 * The prompt enhancer is a TUI plugin. The server part only needs to exist so
 * the package is recognized by the normal plugin pipeline and id metadata is
 * stable for the package.
 */
export default Plugin.define({
  id: "opencode.prompt-enhancer",
  setup() {},
})
