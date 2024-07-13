#!/usr/bin/env node

import { runGenerator } from '../generator';
import path from 'path';
console.log('process.argv', process.argv);
// Получение пути к конфигурационному файлу из аргументов командной строки

let configName = process.argv[2];

configName = configName ?? 'cc.config.js';

const configPath = path.resolve(configName);
runGenerator(configPath);
