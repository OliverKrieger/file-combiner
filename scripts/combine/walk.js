// recursive file collection

import fs from "fs";
import path from "path";

export function collectFilesRecursive(rootDir, { allowedExtensions, excludeDirs, excludeFiles }) {
    function shouldSkipDir(dirName) {
        return excludeDirs.has(dirName);
    }

    function shouldIncludeFile(fullPath) {
        const base = path.basename(fullPath);
        if (excludeFiles.has(base)) return false;
        const ext = path.extname(base).toLowerCase();
        return allowedExtensions.has(ext);
    }

    function walk(dir) {
        let results = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (shouldSkipDir(entry.name)) continue;
                results = results.concat(walk(fullPath));
            } else if (entry.isFile() && shouldIncludeFile(fullPath)) {
                results.push(fullPath);
            }
        }
        return results;
    }

    return walk(rootDir);
}