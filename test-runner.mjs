import * as esbuild from 'esbuild';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const testFiles = [];
function findTests(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            findTests(fullPath);
        } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) {
            testFiles.push(fullPath);
        }
    }
}
findTests('src');

if (testFiles.length === 0) {
    console.log('No tests found.');
    process.exit(0);
}

async function runTests() {
    let failed = false;
    for (const file of testFiles) {
        console.log(`\nRunning ${file}...`);

        await esbuild.build({
            entryPoints: [file],
            bundle: true,
            outfile: '.test-out.cjs',
            platform: 'node',
            format: 'cjs',
            alias: {
                'obsidian': './obsidian-mock.js'
            }
        });

        const run = spawn('node', ['.test-out.cjs'], { stdio: 'inherit' });
        const code = await new Promise(resolve => run.on('close', resolve));
        if (code !== 0) failed = true;
    }
    if (failed) process.exit(1);
}

void runTests();
