import { defineConsolidatorConfig } from '@teunlao/code-consolidator';
import { projectFiles } from './project_files';

const config = defineConsolidatorConfig({
  inputFiles: [
    projectFiles.
  ],
  outputFile: 'out.gen.txt',
  includeComments: true,
});

config.generate();
