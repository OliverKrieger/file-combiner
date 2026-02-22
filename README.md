# Commands
`npm run combine` → uses config, outputs combined_vault.md (or chunked parts)
`npm run combine -- --path "…/C1-B3"` → uses that folder, but name defaults to outputName unless you pass --name
`npm run combine -- --name old_mine` → overrides output name
`npm run combine -- --include ".md,.txt"` → overrides extensions
`npm run combine -- --exclude "Note Dump,Wallpapers"` → adds extra excludes on top of config
`npm run combine -- --excludeMode replace --exclude ".obsidian,imgs"` → replace config excludes entirely (optional, but handy)