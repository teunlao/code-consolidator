#!/usr/bin/env node

import { generateFilesStructure } from '../generator';
import path from 'path';

const ouputFile = process.argv[2] ?? 'project_files.ts';
const outputPath = path.resolve(process.cwd(), ouputFile);

generateFilesStructure(outputPath);
