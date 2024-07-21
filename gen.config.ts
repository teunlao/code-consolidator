import { defineConsolidatorConfig } from '@teunlao/code-consolidator';
import { projectFiles } from './project_files';

const config = defineConsolidatorConfig({
  inputFiles: [projectFiles],
  outputFile: 'out.gen.pdf',
  includeComments: true,
  newPageForEachFile: false,
  ignorePaths: ['.idea', 'tsconfig.json'],
});

config.generate();
