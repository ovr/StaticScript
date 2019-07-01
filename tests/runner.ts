
import * as fs from "fs";
import * as path from "path";
import {execFileSync} from "child_process";

const testFileBasePath = path.join(__dirname, 'snapshots');

const testFiles = [];

fs.readdirSync(testFileBasePath).forEach((directory: string) => {
    fs.readdirSync(path.join(testFileBasePath, directory)).forEach((file) => {
        if (file.endsWith(".ts")) {
            testFiles.push(path.join(testFileBasePath, directory, file));
        }
    });
});

async function main() {
    try {
        for (const testFile of testFiles) {
            console.log(testFile, "\n");

            const compileLog = execFileSync(path.join(__dirname, '..', 'bin', 'ssc'), [
                '--printIR',
                '--debug',
                testFile
            ]);

            console.log(compileLog.toString());

            const stdoutExecution = execFileSync(path.join(__dirname, '..', 'output', 'main'));

            if (fs.existsSync(path.join(`${testFile}.stdout`))) {
                const expectedStdout = fs.readFileSync(path.join(`${testFile}.stdout`));

                if (expectedStdout.toString() != stdoutExecution.toString()) {
                    console.log('Unexpected stdout');
                    console.log(stdoutExecution.toString());

                    console.log('Expected stdout');
                    console.log(expectedStdout.toString());

                    process.exit(1);
                }
            }
        }
    } catch (error) {
        console.log(error.output.toString());

        process.exit(1);
    }
}

main();
