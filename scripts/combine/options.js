// merge config + CLI into final options

import { parseCsvList, resolveDir } from "./utils.js";

export function buildOptions(config, cli) {
    const sourceRaw = cli.path || config.vaultPath;
    const sourcePath = resolveDir(sourceRaw);

    if (!sourcePath) throw new Error("Missing vaultPath in config and no --path provided.");

    const chunkSize = cli.chunkSizeRaw != null ? Number(cli.chunkSizeRaw) : config.chunkSize;
    if (Number.isNaN(chunkSize)) throw new Error("--chunkSize must be a number.");

    const includeExtensions = (cli.includeRaw ? parseCsvList(cli.includeRaw) : config.includeExtensions)
        .map((e) => (e.startsWith(".") ? e.toLowerCase() : "." + e.toLowerCase()));
    const allowedExtensions = new Set(includeExtensions);

    const cliExcludeDirs = parseCsvList(cli.excludeRaw);
    const excludeDirs =
        cli.excludeRaw && cli.excludeMode === "replace"
            ? new Set(cliExcludeDirs)
            : new Set([...config.excludeDirs, ...cliExcludeDirs]);

    const excludeFiles = new Set(config.excludeFiles);

    return {
        sourcePath,
        chunkSize,
        outputName: cli.name || config.outputName,
        allowedExtensions,
        excludeDirs,
        excludeFiles,
    };
}