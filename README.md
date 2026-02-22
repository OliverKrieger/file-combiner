# Commands
`npm run combine` → uses config, outputs combined_vault.md (or chunked parts)
`npm run combine -- --path "…/C1-B3"` → uses that folder, but name defaults to outputName unless you pass --name
`npm run combine -- --name old_mine` → overrides output name
`npm run combine -- --include ".md,.txt"` → overrides extensions
`npm run combine -- --exclude "Note Dump,Wallpapers"` → adds extra excludes on top of config
`npm run combine -- --excludeMode replace --exclude ".obsidian,imgs"` → replace config excludes entirely (optional, but handy)

# PowerShell Examples
```PowerShell
./run.ps1
./run.ps1 -Path "DM Section/Valewryn Arc - Last Echo/Quests" -Name "valewryn_quests"
./run.ps1 -Path ".\DM Section\The Shattered Crown\Session Notes" -Include ".md,.txt"
./run.ps1 -Exclude ".obsidian,imgs" -ExcludeMode replace
```

# Structure

```
scripts/
  combine/
    index.js          # main entry (wires everything together)
    config.js         # load/validate config.json
    args.js           # parse CLI args
    options.js        # merge config + CLI into final options
    walk.js           # recursive file collection
    render.js         # noteHeader + combine/chunk writing
    utils.js          # sanitize, resolve paths, csv parsing
  run-combine.ps1     # optional wrapper
config.json
package.json
```
