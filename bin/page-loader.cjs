#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const downloadPage = require('../src/index.cjs');

const program = new Command();

program
  .name('page-loader')
  .description('Download web page and its resources')
  .version('1.0.0')
  .option('-o, --output <dir>', 'output directory', process.cwd())
  .argument('<url>', 'URL of the page to download')
  .action(async (url, options) => {
    try {
      const outputDir = path.resolve(options.output);
      const filePath = await downloadPage(url, outputDir);
      console.log(`Page was downloaded as '${path.basename(filePath)}'`);
      process.exit(0);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
