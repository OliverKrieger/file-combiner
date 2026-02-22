// noteHeader + combine/chunk writing

import fs from "fs";
import path from "path";

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
        fs.writeFileSync(outPath, combined, "utf8");
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
        fs.writeFileSync(outPath, content, "utf8");
        outPaths.push(outPath);
    });
    return outPaths;
}