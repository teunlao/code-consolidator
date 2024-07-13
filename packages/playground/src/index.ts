import { defineConsolidatorConfig } from '@code-consolidator/generator';

const config = defineConsolidatorConfig({
  inputFiles: ['src/index.ts'],
  outputFile: 'gen.txt',
  includeComments: false,
});

config.generate();
