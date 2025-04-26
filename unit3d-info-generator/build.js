const fs = require('fs-extra');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const REPO_ROOT = path.join(__dirname, '..'); // Go up one level to repo root
const MAIN_FILE = 'unit3d-info-generator.user.js';
const MODULES_DIR = path.join(SRC_DIR, 'modules');

// Read the main file
const mainContent = fs.readFileSync(path.join(SRC_DIR, MAIN_FILE), 'utf8');

// Extract the header (metadata block)
const headerMatch = mainContent.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!headerMatch) {
    console.error('Could not find userscript header');
    process.exit(1);
}
const header = headerMatch[0];

// Read all module files
const moduleFiles = fs.readdirSync(MODULES_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
        name: file.replace('.js', ''),
        content: fs.readFileSync(path.join(MODULES_DIR, file), 'utf8')
    }));

// Create the bundled content
let bundledContent = header + '\n\n';

// Add each module as a class
moduleFiles.forEach(module => {
    // Remove export statement and any other export-related code
    let classContent = module.content
        .replace(/export\s+/g, '')  // Remove export statements
        .replace(/import\s+.*?from\s+.*?;/g, '')  // Remove import statements
        .trim();

    // Ensure the class has proper closing brace
    if (!classContent.endsWith('}')) {
        classContent += '\n}';
    }

    bundledContent += classContent + '\n\n';
});

// Add the main initialization code
bundledContent += `
(function () {
    'use strict';

    console.log('MediaInfo Parser script loaded');

    // Initialize modules
    const config = new Config();
    const utils = new Utils();
    const dataValidator = new DataValidator();
    const mediaInfoParser = new MediaInfoParser(dataValidator, utils);
    const uiHandler = new UIHandler(mediaInfoParser, utils, config);

    // Start the application
    uiHandler.initialize();
})();
`;

// Write the bundled file to repository root
fs.writeFileSync(path.join(REPO_ROOT, MAIN_FILE), bundledContent);

console.log('Build completed successfully!');
console.log(`Output file: ${path.join(REPO_ROOT, MAIN_FILE)}`); 