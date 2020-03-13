const { exec } = require('child_process');
'use strict';

/* Blackbox test for the gitDescribe and gitDescribeSync functions
 * using operations on a real git repository.
 * Requires a git binary available in the executable path.
 * The test-repo directory must be writable.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const expect = require('chai').expect;
const TestRepo = require('./lib/test-repo');

const repoDir = path.join(os.tmpdir(), 'test-repo');
const repo = new TestRepo(repoDir);

before(function() {
    repo.clean();
});

describe('appversion', function() {
    it('should skip when no package.json is found.', function(done) {
        exec('node index.js --root=' + repoDir + ' --file=version-test.ts', (err, stdout, stderr) => {
            if (err) {
                done('Test failed: Could not execute command.');
                return;
            }
            if (stderr) {
                done(stderr);
                return;
            }
            expect(stdout).to.contains('Cannot find package.json in root path. Skipping...');
            done();
        });
    });

    it('should succeed with default settings and without a Git repository', function(done) {
        fs.mkdirSync(path.join(repoDir, 'src'), {recursive: true});
        fs.writeFileSync(path.join(repoDir, 'package.json'), '{"version": "1.0.0"}');
        exec('node index.js --root=' + repoDir, (err, stdout, stderr) => {
            if (err) {
                done('Test failed: Could not execute command.');
                return;
            }
            if (stderr) {
                done(stderr);
                return;
            }
            expect(stdout).to.match(/Writing version module to/);
            const outputFile = path.join(repoDir, 'src', '_versions.ts');
            if (!fs.existsSync(outputFile)) {
                done('File ' + outputFile + ' not found.');
                return;
            }
            const fileContents = fs.readFileSync(outputFile, 'utf8');
            expect(fileContents).to.contains('version: \'1.0.0\'');
            expect(fileContents).not.to.contains('obj.versionLong = \'1.0.0-');
            done();
        });
    });

    it('should succeed with default settings', function(done) {
        repo.init();
        fs.mkdirSync(path.join(repoDir, 'src'));
        fs.writeFileSync(path.join(repoDir, 'package.json'), '{"version": "1.0.0"}');
        exec('node index.js --root=' + repoDir, (err, stdout, stderr) => {
            if (err) {
                done('Test failed: Could not execute command.');
                return;
            }
            if (stderr) {
                done(stderr);
                return;
            }
            expect(stdout).to.match(/Writing version module to/);
            const outputFile = path.join(repoDir, 'src', '_versions.ts');
            if (!fs.existsSync(outputFile)) {
                done('File ' + outputFile + ' not found.');
                return;
            }
            const fileContents = fs.readFileSync(outputFile, 'utf8');
            expect(fileContents).to.contains('version: \'1.0.0\'');
            expect(fileContents).to.contains('obj.versionLong = \'1.0.0-');
            expect(fileContents).to.not.contains('obj.versionLong = \'1.0.0-\'');
            done();
        });
    });


    it('should succeed with different file output', function(done) {
        repo.init();
        fs.writeFileSync(path.join(repoDir, 'package.json'), '{"version": "1.0.0"}');
        exec('node index.js --root=' + repoDir + ' --file=version-test.ts', (err, stdout, stderr) => {
            if (err) {
                done('Test failed: Could not execute command.');
                return;
            }
            if (stderr) {
                done(stderr);
                return;
            }
            expect(stdout).to.match(/Writing version module to/);
            const outputFile = path.join(repoDir, 'version-test.ts');
            if (!fs.existsSync(outputFile)) {
                done('File ' + outputFile + ' not found.');
                return;
            }
            const fileContents = fs.readFileSync(outputFile, 'utf8');
            expect(fileContents).to.contains('version: \'1.0.0\'');
            expect(fileContents).to.contains('obj.versionLong = \'1.0.0-');
            expect(fileContents).to.not.contains('obj.versionLong = \'1.0.0-\'');
            done();
        });
    });

    it('should succeed when .git directory is not in root', function(done) {
        repo.init();
        const applicationDir = path.join(repoDir, 'application');
        fs.mkdirSync(applicationDir);
        fs.mkdirSync(path.join(applicationDir, 'src'));
        fs.writeFileSync(path.join(applicationDir, 'package.json'), '{"version": "1.0.0"}');
        exec('node index.js --root=' + applicationDir + ' --git=..', (err, stdout, stderr) => {
            if (err) {
                done('Test failed: Could not execute command.');
                return;
            }
            if (stderr) {
                done(stderr);
                return;
            }
            const outputFile = path.join(applicationDir, 'src', '_versions.ts');
            if (!fs.existsSync(outputFile)) {
                done('File ' + outputFile + ' not found.');
                return;
            }
            const fileContents = fs.readFileSync(outputFile, 'utf8');
            expect(fileContents).to.contains('version: \'1.0.0\'');
            expect(fileContents).to.contains('obj.versionLong = \'1.0.0-');
            expect(fileContents).to.not.contains('obj.versionLong = \'1.0.0-\'');
            done();
        });
    });
});
