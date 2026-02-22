// noteHeader + combine/chunk writing

import fs from "fs";
import path from "path";

function atomicWriteFile(destPath, content) {
    const dir = path.dirname(destPath);
    const tmpPath = path.join(dir, `.${path.basename(destPath)}.${Date.now()}.tmp`);

    fs.writeFileSync(tmpPath, content, "utf8");

    // ensure overwrite is clean on Windows
    if (fs.existsSync(destPath)) fs.rmSync(destPath, { force: true });

    fs.renameSync(tmpPath, destPath);
}

export function buildHeader(sourcePath, filePath) {
    const rel = path.relative(sourcePath, filePath).replace(/\\/g, "/");
    return `\n\n---\n# ${rel}\n\n`;
}

export function writeCombined({ files, sourcePath, outputDir, outputBaseName, chunkSize }) {
    if (chunkSize === -1) {
        let combined = "";
        for (const filePath of files) {
            combined += `${buildHeader(sourcePath, filePath)}${fs.readFileSync(filePath, "utf8")}\n`;
        }
        const outPath = path.join(outputDir, `${outputBaseName}.md`);
        atomicWriteFile(outPath, combined);
        return [outPath];
    }

    let current = "";
    let currentLen = 0;
    const chunks = [];

    for (const filePath of files) {
        const note = `${buildHeader(sourcePath, filePath)}${fs.readFileSync(filePath, "utf8")}\n`;
        if (currentLen + note.length > chunkSize && current.length > 0) {
            chunks.push(current);
            current = "";
            currentLen = 0;
        }
        current += note;
        currentLen += note.length;
    }
    if (current.length > 0) chunks.push(current);

    const outPaths = [];
    chunks.forEach((content, i) => {
        const outPath = path.join(outputDir, `${outputBaseName}_part_${i + 1}.md`);
        atomicWriteFile(outPath, content);
        outPaths.push(outPath);
    });
    return outPaths;
}