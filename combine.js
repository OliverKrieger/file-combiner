import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
    console.error("❌ config.json not found. Please create one with vaultPath.");
    process.exit(1);
}

const { vaultPath, chunkSize = 10000 } = JSON.parse(
    fs.readFileSync(configPath, "utf8")
);

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

function combineFiles() {
    console.log("📚 Scanning vault:", vaultPath);

    const mdFiles = getMarkdownFiles(vaultPath);
    console.log(`📄 Found ${mdFiles.length} markdown files`);

    let partIndex = 1;
    let currentOutput = "";
    let currentLength = 0;

    const outputs = [];

    for (const filePath of mdFiles) {
        const noteContent = `\n\n---\n# ${path.basename(filePath)}\n\n${fs.readFileSync(filePath, "utf8")}\n`;
        const noteLength = noteContent.length;

        // If adding this note exceeds the chunk size, start a new file
        if (currentLength + noteLength > chunkSize) {
            outputs.push(currentOutput);
            currentOutput = "";       // reset buffer
            currentLength = 0;
        }

        currentOutput += noteContent;
        currentLength += noteLength;
    }

    // Push the final part if it contains anything
    if (currentOutput.length > 0) {
        outputs.push(currentOutput);
    }

    // Write each part to disk
    outputs.forEach((content, index) => {
        const outputPath = path.join(
            __dirname,
            `combined_vault_part_${index + 1}.md`
        );
        fs.writeFileSync(outputPath, content, "utf8");
        console.log(`✅ Created: ${outputPath}`);
    });

    console.log(`🎉 Finished. Created ${outputs.length} output files.`);
}

combineFiles();
