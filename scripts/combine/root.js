import fs from "fs";
import path from "path";

/**
 * Walks upward from `startDir` until it finds a directory containing `package.json`.
 * This makes the script resilient to being moved around.
 */
export function findProjectRoot(startDir) {
    let dir = startDir;

    while (true) {
        const pkg = path.join(dir, "package.json");
        if (fs.existsSync(pkg)) return dir;

        const parent = path.dirname(dir);
        if (parent === dir) break; // reached filesystem root
        dir = parent;
    }

    throw new Error(
        "Could not find project root (no package.json found in any parent directory)."
    );
}