# LibreOffice core source

The original LibreOffice kit repository pins `https://github.com/LibreOffice/core.git` at commit `bce0998afefdbc355585ca324285661a2170ba77` as a Git submodule.

That very large third-party repository is not vendored here because it is unrelated to the DeepSeek frontend and is not needed to build the JavaScript adapter. The exact revision, complete DeepSeek patch set, build recipes, and payload hashes are recorded in `analysis/runtime-map.json` and in the generated desktop extraction.
