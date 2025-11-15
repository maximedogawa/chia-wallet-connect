const fs = require('fs');
const path = require('path');

// Read main package.json
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

// Create dist/package.json with correct exports
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  main: './index.js',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      import: './index.js',
      require: './index.js',
      types: './index.d.ts'
    },
    './styles': './styles/globals.css',
    './tailwind.config': '../tailwind.config.js'
  }
};

// Write dist/package.json
const distPath = path.resolve(__dirname, '../dist/package.json');
fs.writeFileSync(distPath, JSON.stringify(distPkg, null, 2));

