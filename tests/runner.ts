
import * as fs from "fs";
import * as path from "path";
import {execFileSync} from "child_process";

const testFilePath = path.join(__dirname, 'snapshots', 'math');
const testFiles = fs.readdirSync(testFilePath).filter(file => file.endsWith(".ts")).map(file => {
    return path.join(testFilePath, file);
});

async function main() {
    try {
        for (const testFile of testFiles) {
            console.log(testFile, "\n");

            const result = execFileSync(path.join(__dirname, '..', 'bin', 'ssc'), [
                '--printIR',
                testFile
            ]);

            console.log(result.toString());
        }
    } catch (error) {
        console.log(error.output.toString());

        process.exit(1);
    }
}

main();
