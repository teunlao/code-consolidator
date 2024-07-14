import { defineConsolidatorConfig } from '@teunlao/code-consolidator';
import { projectFiles } from './project_files';

const config = defineConsolidatorConfig({
  inputFiles: [projectFiles],
  outputFile: 'out.gen.pdf',
  includeComments: true,
  newPageForEachFile: false,
});

config.generate();
