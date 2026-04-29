// load/validate config.json and .env

import fs from "fs";
import path from "path";

function stripQuotes(value) {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

export function loadEnv(baseDir) {
    const envPath = path.join(baseDir, ".env");
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = stripQuotes(trimmed.slice(separatorIndex + 1));
        if (key && process.env[key] == null) {
            process.env[key] = value;
        }
    }
}

export function loadConfig(baseDir) {
    const configPath = path.join(baseDir, "config.json");
    if (!fs.existsSync(configPath)) {
        throw new Error("config.json not found. Please create one.");
    }
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

export function normalizeConfig(cfg) {
    return {
        vaultPath: cfg.vaultPath || process.env.OBSIDIAN_VAULT_PATH || process.env.VAULT_PATH,
        chunkSize: typeof cfg.chunkSize === "number" ? cfg.chunkSize : 10000,
        outputName: cfg.outputName || "combined_vault",
        includeExtensions: Array.isArray(cfg.includeExtensions) ? cfg.includeExtensions : [".md"],
        excludeDirs: Array.isArray(cfg.excludeDirs) ? cfg.excludeDirs : [],
        excludeFiles: Array.isArray(cfg.excludeFiles) ? cfg.excludeFiles : [],
    };
}
