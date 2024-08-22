/* eslint-env es6 */
/* eslint no-console: "off" */

var package = require('./package.json');
var fs = require('fs');
var path = require('path');

/**
 * Returns true if the given file is contained within the given path or false if not
 * @param {string} directory - path to a directory that may contain the file
 * @param {string} file - path to a file/directory that may be contained
 * @returns {boolean} if the file is contained within the path
 */
function pathContained(directory, file) {
    var relativePath = path.relative(directory, file);
    return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

/**
 * Returns true if the file1 represents file2 or false if not
 * @param {string} file1 - path to a file that might be file2
 * @param {string} file2 - path to a file that might be file1
 * @returns {boolean} if file1 represents file2
 */
function fileExcluded(file1, file2) {
    let testItem = file1;
    if (file1.startsWith('.')) {
        testItem = file1.substring(1);
    }
    return file2.endsWith(testItem);
}

// Get configuration data from package.json and validate it
var config = package.resolve;

// This is a cartridge path configured as an array
// ex. cartridge:other_cartridge is ['cartridge', 'other_cartridge']
var cartridgepath = config.cartridgepath;
if (!cartridgepath) {
    return console.error('ERROR: No resolve.cartridgepath defined');
}

// This is a map of cartridge names to the root directory of their relative template paths
// ex. {'base_cartridge':'../base repo/cartridges/base_cartridge/cartridge/templates/default/'}
var dependencies = config.dependencies;
if (!dependencies) {
    return console.error('ERROR: No resolve.dependencies defined');
}

// Validate that we have a dependency folder for each cartridge in the configured path
for (var index = 0; index < cartridgepath.length; index++) {
    if (!dependencies[cartridgepath[index]]) {
        return console.error('ERROR: No resolve.dependencies property for cartridge name ' + cartridgepath[index]);
    }
}

// This is the target template directory to which files are copied
var targetDir = config.target;

// These are the directories where templates from dependency cartridges will be copied
var targetDirectories = config.targets;
if (!targetDirectories || !targetDirectories.includes) {
    return console.error('ERROR: No resolve.targets defined');
}

if (!config.templates) {
    return console.error('ERROR: No resolve.templates defined');
}

// This is an array of root directories to scan recursively for templates in cartridges for this plugin
// These are templates that at runtime will override those for cartridges later in the path
var templateIncludes = config.templates.includes;
if (!templateIncludes) {
    return console.error('ERROR: No resolve.templates.includes defined');
}

// This is an array of root directories to ignore when scanning for templates for this plugin
var templateExcludes = config.templates.excludes || [];

/**
 * Gets all the file paths in the given directory recursively.
 * @param {string} directory - path to the directory whose files to retrieve
 * @param {boolean} [includeDirectories=false] - if directory paths should be included
 * @returns {Promise} promise to resolve an array of file paths
 */
function getFiles(directory, includeDirectories) {
    return new Promise((resolve, reject) => {
        /**
         * Modified from https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
         * @param {string} dir - path to the directory to walk
         * @param {function} done - callback function
         */
        function walk(dir, done) {
            var results = [];
            fs.readdir(dir, function (err, list) {
                if (err) return done(err);
                var i = 0;
                (function next() { // eslint-disable-line
                    var file = list[i++];
                    if (!file) return done(null, results);
                    file = path.resolve(dir, file);
                    fs.stat(file, function (err, stat) {
                        if (stat && stat.isDirectory()) {
                            walk(file, function (err, res) {
                                results = results.concat(res);
                                if (includeDirectories) {
                                    results.push(file);
                                }
                                next();
                            });
                        } else {
                            results.push(file);
                            next();
                        }
                    });
                })();
                return undefined;
            });
        }

        walk(directory, function (err, files) {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

/**
 * Copies the source file to the target, creating any parent directories of the
 * target file which don't yet exist.
 * @param {string} src - path to the file to copy
 * @param {string} target - path where the file is to be copied
 * @returns {Promise} promise to resolve an array of included template relative file paths
 */
function copyFile(src, target) {
    return new Promise((resolve, reject) => {
        fs.promises.mkdir(path.dirname(target), { recursive: true })
            .then(() => {
                fs.promises.copyFile(src, target)
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * Gets all the template file relative paths. Configured included template paths
 * are scanned, and files are ignored if contained within configured excluded
 * template paths.
 * @returns {Promise} promise to resolve an array of included template relative file paths
 */
function getTemplateFilePaths() {
    console.debug('');
    console.debug('Getting template file paths...');
    return new Promise((resolve, reject) => {
        Promise.all(templateIncludes.map(function (templatePath) {
            console.debug('- Getting template files in ' + templatePath);
            return getFiles(templatePath)
                .then(files => {
                    var relativePaths = [];
                    files.forEach(file => {
                        if (!file.endsWith('.isml')) {
                            console.debug('  - ignored non template: ' + path.relative('.', file));
                            return;
                        }
                        // prepend locale directory to relativePath
                        var relativePath = path.relative(templatePath, file);
                        relativePath = path.basename(templatePath) + path.sep + relativePath;
                        if (templateExcludes.some(excludedItem => {
                            let doIgnore = false;
                            if (excludedItem.endsWith('.isml')) {
                                doIgnore = fileExcluded(excludedItem, file);
                            } else {
                                // Check if the file is contained in an excluded directory
                                doIgnore = pathContained(excludedItem, file);
                            }
                            return doIgnore;
                        })) {
                            console.debug('  - ignored file in excluded path: ' + path.relative('.', file));
                        } else {
                            relativePaths.push(relativePath);
                            console.debug('  - included template file relativePath: ' + relativePath);
                            console.debug('  - included template file: ' + path.relative('.', file));
                        }
                    });
                    return relativePaths;
                })
                .catch(err => { reject(err); });
        }))
        .then(res => { resolve([].concat.apply([], res)); })
        .catch(reject);
    });
}

/**
 * Gets an array of template file paths to the given template file relative path
 * in each of the cartridges in the configured cartridge path. The array will
 * be in the order of the cartridges in the cartridge path.
 * @param {string} templateFilePath - template file relative path
 * @returns {Promise} promise to resolve an array of cartridge template file paths
 */
function resolveTemplateFile(templateFilePath) {
    return new Promise((resolve, reject) => {
        Promise.all(cartridgepath.map(function (cartridgeName) {
            return dependencies[cartridgeName] + templateFilePath;
        }))
        .then(resolve)
        .catch(reject);
    });
}

/**
 * Gets an object whose keys are template file relative paths and whose values
 * are arrays of template file paths in each of the cartridges in the configured
 * cartridge path. The array will be in the order of the cartridges in the
 * cartridge path.
 * @returns {Promise} promise to resolve an object mapping template file
 * relative paths to cartridge specific template file paths
 */
function resolveCartridgeTemplateFiles() {
    return new Promise((resolve, reject) => {
        getTemplateFilePaths()
            .then(templateFilePaths => {
                console.debug('');
                console.debug('Resolving template file paths in dependency cartridges...');
                Promise.all(templateFilePaths.map(templateFilePath => {
                    return resolveTemplateFile(templateFilePath)
                        .then(cartridgeTemplateFiles => {
                            console.debug('- Resolved ' + path.relative('.', templateFilePath));
                            cartridgeTemplateFiles.forEach(cartridgeTemplateFile => {
                                console.debug('  - ' + path.relative('.', cartridgeTemplateFile));
                            });

                            var v = {};
                            v[templateFilePath] = cartridgeTemplateFiles;
                            return v;
                        });
                }))
                .then(res => { resolve(Object.assign.apply({}, res)); })
                .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * Gets the first cartridge template file path in the given array that is a path
 * to an existing file in its cartridge.
 * @param {Array} cartridgeTemplateFiles - array containing paths to potential templates in dependency cartridges
 * @returns {Promise} promise to resolve the cartridge template file
 */
function resolveCartridgeTemplateFile(cartridgeTemplateFiles) {
    return new Promise((resolve, reject) => {
        Promise.all(cartridgeTemplateFiles.map(cartridgeTemplateFile => {
            return new Promise(accessResolve => {
                fs.promises.access(cartridgeTemplateFile)
                    .then(() => { accessResolve(true); })
                    .catch(() => { accessResolve(false); });
            });
        }))
        .then(cartridgeTemplateFilesExists => {
            for (var i = 0; i < cartridgeTemplateFilesExists.length; i++) {
                if (cartridgeTemplateFilesExists[i]) {
                    return resolve(cartridgeTemplateFiles[i]);
                }
            }
            // No cartridge template file exists for this one
            return resolve(null);
        })
        .catch(reject);
    });
}

/**
 * Gets an object whose keys are template file relative paths and whose values
 * are the cartridge template file paths to the template files that would be
 * next used if the template file didn't exist. In other words the next template
 * that would be included in the cartridge path at the same relative path.
 * @returns {Promise} promise to resolve the cartridge template file fallbacks
 */
function resolveCartridgeTemplateFileFallbacks() {
    return new Promise((resolve, reject) => {
        resolveCartridgeTemplateFiles()
            .then(cartridgeTemplateFiles => {
                console.debug('');
                console.debug('Resolving cartridge template file fallbacks...');
                Promise.all(Object.keys(cartridgeTemplateFiles).map(templateFilePath => {
                    return resolveCartridgeTemplateFile(cartridgeTemplateFiles[templateFilePath])
                        .then(cartridgeTemplateFile => {
                            var v = {};
                            if (cartridgeTemplateFile) {
                                v[templateFilePath] = cartridgeTemplateFile;
                                console.debug('  - ' + path.relative('.', templateFilePath) + ' fallback is ' + path.relative('.', cartridgeTemplateFile));
                            } else {
                                console.debug('  - No cartridge template file for ' + path.relative('.', templateFilePath));
                            }
                            return v;
                        });
                }))
                .then(res => { resolve(Object.assign.apply({}, res)); })
                .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * Deletes the target directory and all its contents recursively.
 * @param {string} targetDirectory - the target directory to be deleted
 * @returns {Promise} promise to delete the target directory
 */
function deleteTargetDirectory(targetDirectory) {
    console.debug('');
    console.debug('Deleting target directory...');
    return new Promise((resolve, reject) => {
        getFiles(targetDirectory)
            .then(targetFiles => {
                Promise.all(targetFiles.map(targetFile => {
                    console.debug('- Deleting file ' + path.relative('.', targetFile));
                    return fs.promises.unlink(targetFile);
                }))
                .then(() => {
                    getFiles(targetDirectory, true)
                        .then(targetContainedDirectories => {
                            Promise.all(targetContainedDirectories.map(targetContainedDirectory => {
                                console.debug('- Deleting directory ' + path.relative('.', targetContainedDirectory));
                                return fs.promises.rmdir(targetContainedDirectory);
                            }))
                            .then(() => {
                                console.debug('- Deleting target directory ' + path.relative('.', targetDirectory));
                                fs.promises.rmdir(targetDirectory)
                                    .then(resolve)
                                    .catch(reject);
                            })
                            .catch(reject);
                        })
                        .catch(reject);
                })
                .catch(reject);
            })
            .catch(err => {
                if (err.code === 'ENOENT') {
                    // Target directory doesn't exist, that's fine
                    resolve();
                } else {
                    reject(err);
                }
            });
    });
}

/**
 * Deletes the target directories and all its contents recursively.
 * @returns {Promise} promise to delete the target directories.
 */
function deleteTargetDirectories() {
    console.debug('');
    console.debug('Deleting target directories...');

    var promises = [];

    targetDirectories.includes.forEach(theTargetDir => {
        promises.push(deleteTargetDirectory(theTargetDir));
    });

    return Promise.all(promises);
}

/**
 * Creates a new empty target directory.
 * @returns {Promise} promise to create the target directory
 */
function createTargetDirectories() {
    console.debug('');
    console.debug('Creating new empty target directories...');

    // collect an array of promises
    var promises = [];
    targetDirectories.includes.forEach(theTargetDir => {
        console.debug('- ' + theTargetDir);
        promises.push(fs.promises.mkdir(theTargetDir));
    });

    return Promise.all(promises);
}

/**
 * Copies the fallback files from cartridge path dependencies to the target
 * directory for each included template file.
 * @returns {Promise} promise to create the target directory
 */
function copyCartridgeTemplateFileFallbacksToTarget() {
    return new Promise((resolve, reject) => {
        resolveCartridgeTemplateFileFallbacks()
            .then(cartridgeTemplateFileFallbacks => {
                console.debug('');
                console.debug('Copying template file fallbacks to target directories...');
                Promise.all(Object.keys(cartridgeTemplateFileFallbacks)
                    .map(cartridgeTemplateFile => {
                        var fallbackFile = cartridgeTemplateFileFallbacks[cartridgeTemplateFile];
                        console.debug('Copying template file ' + cartridgeTemplateFile);
                        console.debug('Fallback file ' + fallbackFile);

                        // get locale directory name from the template file
                        // and update the target directory with locale name
                        var dirName = path.dirname(cartridgeTemplateFile);
                        var dirParts = dirName.split(path.sep);
                        var targetDirectory = targetDir.replace('LOCALE_TO_REPLACED', dirParts[0]);

                        // remove locale name from template file
                        var cartridgeTemplateFileNoLocale = cartridgeTemplateFile.replace(dirParts[0] + path.sep, '');

                        var targetFile = path.join(targetDirectory, cartridgeTemplateFileNoLocale);

                        console.debug('- Copying file ' + path.relative('.', fallbackFile) + ' to ' + path.relative('.', targetFile));
                        return copyFile(fallbackFile, targetFile);
                    }))
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
    });
}

return deleteTargetDirectories()
    .then(createTargetDirectories)
    .then(copyCartridgeTemplateFileFallbacksToTarget);
