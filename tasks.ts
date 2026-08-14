import { renameSync } from 'node:fs';
import { deleteFoldersRecursive, copyFiles, npmInstall, buildReact, patchHtmlFile } from '@iobroker/build-tools';

// ts-node appends its own bootstrap arguments (including the relative "--project tsconfig.tasks.json")
// to process.execArgv, and child_process.fork() inherits them. The children started by
// @iobroker/build-tools run with cwd=src-admin, where that relative tsconfig does not exist,
// so they would die with "TS5083: Cannot read file .../src-admin/tsconfig.tasks.json".
// The children are plain JS (vite) and do not need ts-node at all.
process.execArgv = [];

function clean(): void {
    deleteFoldersRecursive(`${__dirname}/admin`, ['modbus.png']);
}

function copyAllFiles(): void {
    copyFiles(['src-admin/build/**/*'], 'admin/');
}

function patch(): Promise<void> {
    return patchHtmlFile(`${__dirname}/admin/index.html`).then(() => {
        renameSync(`${__dirname}/admin/index.html`, `${__dirname}/admin/index_m.html`);
    });
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(`${__dirname}/src-admin`).catch((e: unknown) => {
        console.error(`Cannot install npm: ${e as string}`);
        process.exit(1);
    });
} else if (process.argv.includes('--2-build')) {
    buildReact(`${__dirname}/src-admin/`, {
        rootDir: __dirname,
        vite: true,
    }).catch((e: unknown) => {
        console.error(`Cannot build react: ${e as string}`);
        process.exit(1);
    });
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else if (process.argv.includes('--4-patch')) {
    patch().catch((e: unknown) => {
        console.error(`Cannot patch: ${e as string}`);
        process.exit(1);
    });
} else if (process.argv.includes('--build')) {
    clean();
    npmInstall(`${__dirname}/src-admin`)
        .then(() =>
            buildReact(`${__dirname}/src-admin/`, {
                rootDir: __dirname,
                vite: true,
            }),
        )
        .then(() => copyAllFiles())
        .then(() => patch())
        .catch((e: unknown) => {
            console.error(`Cannot build: ${e as string}`);
            process.exit(1);
        });
} else {
    clean();

    npmInstall(`${__dirname}/src-admin`)
        .then(() =>
            buildReact(`${__dirname}/src-admin/`, {
                rootDir: __dirname,
                vite: true,
            }),
        )
        .then(() => copyAllFiles())
        .then(() => patch())
        .catch((e: unknown) => {
            console.error(`Cannot build admin controls: ${e as string}`);
            process.exit(1);
        });
}
