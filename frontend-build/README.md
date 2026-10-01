# Prebuilt frontend artifacts

These files were generated from the vendored `dsh-v0.2.0-rc.2` source with the official client build profile.

- `web/` is the Vite browser shell: HTML, fonts, core JavaScript/CSS, language chunks, preview worker, and source maps.
- `client-plugins/packages/` contains all 177 built `client*.js` bundles and source maps contributed by the plugin packages.
- `desktop-shell/` contains the built Electron main/preload/welcome shell. It does not include Electron itself or native runtimes.
- `client-build-environment.json` records the public values embedded into these artifacts.

The Web shell is not a standalone generic JSON-RPC client. At runtime DeepSeek Harness serves a composed boot manifest and dynamically loads the client plugin bundles through its own gateway. To use the design with another harness, start with `FRONTEND_PORTING.md` and either preserve the client plugin runtime while replacing its transport, or reuse the React components/design tokens inside your own frontend shell.

Absolute local build paths in generated CSS region comments were replaced with `<vendored-source>` before publication. Executable behavior and CSS module identifiers were not changed.
