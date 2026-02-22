// parse CLI args

export function getArgValue(names) {
    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];
        for (const name of names) {
            if (arg === name) return process.argv[i + 1];
            if (arg.startsWith(name + "=")) return arg.slice(name.length + 1);
        }
    }
    return null;
}

export function parseCliArgs() {
    return {
        path: getArgValue(["--path", "-p"]),
        name: getArgValue(["--name", "-n"]),
        chunkSizeRaw: getArgValue(["--chunkSize"]),
        includeRaw: getArgValue(["--include"]),
        excludeRaw: getArgValue(["--exclude"]),
        excludeMode: (getArgValue(["--excludeMode"]) || "merge").toLowerCase(),
    };
}