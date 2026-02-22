// load/validate config.json

import fs from "fs";
import path from "path";

export function loadConfig(baseDir) {
    const configPath = path.join(baseDir, "config.json");
    if (!fs.existsSync(configPath)) {
        throw new Error("config.json not found. Please create one with vaultPath.");
    }
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

export function normalizeConfig(cfg) {
    return {
        vaultPath: cfg.vaultPath,
        chunkSize: typeof cfg.chunkSize === "number" ? cfg.chunkSize : 10000,
        outputName: cfg.outputName || "combined_vault",
        includeExtensions: Array.isArray(cfg.includeExtensions) ? cfg.includeExtensions : [".md"],
        excludeDirs: Array.isArray(cfg.excludeDirs) ? cfg.excludeDirs : [],
        excludeFiles: Array.isArray(cfg.excludeFiles) ? cfg.excludeFiles : [],
    };
}