// main entry (wires everything together)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { findProjectRoot } from "./root.js";
import { loadConfig, loadEnv, normalizeConfig } from "./config.js";
import { parseCliArgs } from "./args.js";
import { buildOptions } from "./options.js";
import { sanitizeFilePart } from "./utils.js";
import { cleanupPreviousOutputs } from "./cleanup.js";
import { collectFilesRecursive } from "./walk.js";
import { writeCombined } from "./render.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = findProjectRoot(__dirname);

// output folder (recreate)
const outputDir = path.join(projectRoot, "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

try {
    loadEnv(projectRoot);
    const cfg = normalizeConfig(loadConfig(projectRoot));
    const cli = parseCliArgs();
    const opts = buildOptions(cfg, cli);

    if (!fs.existsSync(opts.sourcePath) || !fs.statSync(opts.sourcePath).isDirectory()) {
        throw new Error(`Invalid source directory: ${opts.sourcePath}`);
    }

    let files = collectFilesRecursive(opts.sourcePath, opts);
    files = files
        .map((p) => ({ p, rel: path.relative(opts.sourcePath, p).replace(/\\/g, "/") }))
        .sort((a, b) => a.rel.localeCompare(b.rel))
        .map((x) => x.p);

    const outputBaseName = sanitizeFilePart(opts.outputName);

    // delete only files for this base name (not the whole output folder)
    cleanupPreviousOutputs(outputDir, outputBaseName);

    console.log("📚 Scanning:", opts.sourcePath);
    console.log("🧩 Include:", [...opts.allowedExtensions].join(", "));
    console.log("🚫 Exclude dirs:", [...opts.excludeDirs].join(", ") || "(none)");
    console.log("🏷️ Output name:", outputBaseName);
    console.log("📦 Chunk size:", opts.chunkSize);
    console.log(`📄 Found ${files.length} files`);

    const outPaths = writeCombined({
        files,
        sourcePath: opts.sourcePath,
        outputDir,
        outputBaseName,
        chunkSize: opts.chunkSize,
    });

    outPaths.forEach((p) => console.log("✅ Created:", p));
    console.log(`🎉 Finished. Created ${outPaths.length} output file(s).`);
} catch (err) {
    console.error("❌", err?.message || err);
    process.exit(1);
}
