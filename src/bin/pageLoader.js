#!/usr/bin/env node
import program from 'commander';
import { version } from '../../package.json';
import pageLoader from '..';

program
  .version(version)
  .description('load and save page to the output directory')
  .option('-o, --output [output folder] ', 'Output folder', process.cwd())
  .arguments('<url>')
  .action((url) => (
    pageLoader(url, program.output)))
  .parse(process.argv);
