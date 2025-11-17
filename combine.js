import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve script directory (important for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
    console.error("❌ config.json not found. Please create one with vaultPath.");
    process.exit(1);
}

const { vaultPath } = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (!vaultPath || !fs.existsSync(vaultPath)) {
    console.error("❌ Invalid or missing vaultPath in config.json");
    process.exit(1);
}

// Recursively collect all .md files
function getMarkdownFiles(dir) {
    let results = [];

    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(getMarkdownFiles(fullPath));
        } else if (file.toLowerCase().endsWith(".md")) {
            results.push(fullPath);
        }
    }

    return results;
}

// Read + combine all files
function combineFiles() {
    console.log("📚 Scanning vault:", vaultPath);

    const mdFiles = getMarkdownFiles(vaultPath);
    console.log(`📄 Found ${mdFiles.length} markdown files`);

    let output = "";

    mdFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf8");
        output += `\n\n---\n# ${path.basename(filePath)}\n\n${content}\n`;
    });

    const outputPath = path.join(__dirname, "combined_vault.md");
    fs.writeFileSync(outputPath, output, "utf8");

    console.log("✅ Combined document created at:", outputPath);
}

combineFiles();
