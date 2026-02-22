import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- args parsing --------------------
function getArgValue(names) {
    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];
        for (const name of names) {
            if (arg === name) return process.argv[i + 1];
            if (arg.startsWith(name + "=")) return arg.slice(name.length + 1);
        }
    }
    return null;
}

function hasFlag(names) {
    return process.argv.some((a) => names.includes(a));
}

function parseCsvList(value) {
    if (!value) return [];
    return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function sanitizeFilePart(input) {
    return (input ?? "")
        .toString()
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80) || "combined";
}

function resolveDir(p) {
    if (!p) return null;
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

// -------------------- config --------------------
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
    console.error("❌ config.json not found. Please create one with vaultPath.");
    process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

// config defaults
const configVaultPath = cfg.vaultPath;
const configChunkSize = typeof cfg.chunkSize === "number" ? cfg.chunkSize : 10000;
const configOutputName = cfg.outputName || "combined_vault";
const configIncludeExts = Array.isArray(cfg.includeExtensions) ? cfg.includeExtensions : [".md"];
const configExcludeDirs = Array.isArray(cfg.excludeDirs) ? cfg.excludeDirs : [];
const configExcludeFiles = Array.isArray(cfg.excludeFiles) ? cfg.excludeFiles : [];

// CLI overrides
const cliPath = getArgValue(["--path", "-p"]);
const cliName = getArgValue(["--name", "-n"]);
const cliChunkSizeRaw = getArgValue(["--chunkSize"]);
const cliIncludeExtsRaw = getArgValue(["--include"]);      // e.g. ".md,.txt"
const cliExcludeDirsRaw = getArgValue(["--exclude"]);      // e.g. ".obsidian,imgs"
const excludeMode = (getArgValue(["--excludeMode"]) || "merge").toLowerCase(); // merge|replace

const chunkSize = cliChunkSizeRaw != null ? Number(cliChunkSizeRaw) : configChunkSize;
if (Number.isNaN(chunkSize)) {
    console.error("❌ --chunkSize must be a number (or set chunkSize in config.json).");
    process.exit(1);
}

const sourcePathRaw = cliPath || configVaultPath;
const sourcePath = resolveDir(sourcePathRaw);

if (!sourcePath) {
    console.error("❌ Missing vaultPath in config.json and no --path provided.");
    process.exit(1);
}

if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    console.error(`❌ Invalid source directory: ${sourcePath}`);
    process.exit(1);
}

// Extensions: CLI overrides config if provided
const includeExtensions = (cliIncludeExtsRaw
    ? parseCsvList(cliIncludeExtsRaw)
    : configIncludeExts
).map((e) => (e.startsWith(".") ? e.toLowerCase() : "." + e.toLowerCase()));

const allowedExtensions = new Set(includeExtensions);

// Excludes: config applies always, CLI adds by default (merge)
// If you pass --excludeMode replace, CLI replaces config excludes
const cliExcludeDirs = parseCsvList(cliExcludeDirsRaw);

const effectiveExcludeDirs =
    cliExcludeDirsRaw && excludeMode === "replace"
        ? new Set(cliExcludeDirs.map((s) => s.trim()).filter(Boolean))
        : new Set([...configExcludeDirs, ...cliExcludeDirs].map((s) => s.trim()).filter(Boolean));

const effectiveExcludeFiles = new Set(configExcludeFiles.map((s) => s.trim()).filter(Boolean));

// Output folder (recreate)
const outputDir = path.join(__dirname, "output");
if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Output name: CLI overrides config
const outputBaseName = sanitizeFilePart(cliName || configOutputName);

// -------------------- filtering --------------------
function shouldSkipDir(dirName) {
    return effectiveExcludeDirs.has(dirName);
}

function shouldIncludeFile(fullPath) {
    const base = path.basename(fullPath);
    if (effectiveExcludeFiles.has(base)) return false;

    const ext = path.extname(base).toLowerCase();
    return allowedExtensions.has(ext);
}

// -------------------- file collection --------------------
function getFilesRecursive(dir) {
    let results = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (shouldSkipDir(entry.name)) continue;
            results = results.concat(getFilesRecursive(fullPath));
            continue;
        }

        if (entry.isFile() && shouldIncludeFile(fullPath)) {
            results.push(fullPath);
        }
    }

    return results;
}

function noteHeader(filePath) {
    const rel = path.relative(sourcePath, filePath).replace(/\\/g, "/");
    return `\n\n---\n# ${rel}\n\n`;
}

// -------------------- combine --------------------
function combineFiles() {
    console.log("📚 Scanning:", sourcePath);
    console.log("🧩 Include:", [...allowedExtensions].join(", "));
    console.log("🚫 Exclude dirs:", [...effectiveExcludeDirs].join(", ") || "(none)");
    console.log("🏷️ Output name:", outputBaseName);
    console.log("📦 Chunk size:", chunkSize);

    let files = getFilesRecursive(sourcePath);

    // Stable ordering
    files = files
        .map((p) => ({ p, rel: path.relative(sourcePath, p).replace(/\\/g, "/") }))
        .sort((a, b) => a.rel.localeCompare(b.rel))
        .map((x) => x.p);

    console.log(`📄 Found ${files.length} files`);

    if (chunkSize === -1) {
        let combined = "";
        for (const filePath of files) {
            combined += `${noteHeader(filePath)}${fs.readFileSync(filePath, "utf8")}\n`;
        }

        const outputPath = path.join(outputDir, `${outputBaseName}.md`);
        fs.writeFileSync(outputPath, combined, "utf8");

        console.log(`✅ Created: ${outputPath}`);
        console.log("🎉 Finished. Created 1 output file.");
        return;
    }

    // Chunked output
    let currentOutput = "";
    let currentLength = 0;
    const outputs = [];

    for (const filePath of files) {
        const noteContent = `${noteHeader(filePath)}${fs.readFileSync(filePath, "utf8")}\n`;
        const noteLength = noteContent.length;

        if (currentLength + noteLength > chunkSize && currentOutput.length > 0) {
            outputs.push(currentOutput);
            currentOutput = "";
            currentLength = 0;
        }

        currentOutput += noteContent;
        currentLength += noteLength;
    }

    if (currentOutput.length > 0) outputs.push(currentOutput);

    outputs.forEach((content, index) => {
        const outputPath = path.join(outputDir, `${outputBaseName}_part_${index + 1}.md`);
        fs.writeFileSync(outputPath, content, "utf8");
        console.log(`✅ Created: ${outputPath}`);
    });

    console.log(`🎉 Finished. Created ${outputs.length} output files.`);
}

combineFiles();