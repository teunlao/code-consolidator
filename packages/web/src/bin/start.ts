#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

// Путь к директории пакета
const packageDir = path.resolve(__dirname, '../..');

// Путь к бинарной версии next из пакета
const nextBinPath = path.join(packageDir, 'node_modules', '.bin', 'next');

// Порт для запуска приложения
const PORT = process.env.PORT || 3333;

// Функция для ожидания запуска сервера
async function waitForServer(url: string, maxRetries = 30, delay = 500): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server responded with status code ${res.statusCode}`));
          }
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
      
      return;
    } catch (error) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Server failed to start after ${maxRetries} retries`);
}

// Функция для запуска Next.js приложения
async function startApp() {
  console.log('Starting Code Consolidator UI...');
  
  // Запускаем сборку приложения
  try {
    const buildProcess = spawn(nextBinPath, ['build'], {
      cwd: packageDir,
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('Failed to build the application:', error);
    process.exit(1);
  }
  
  // Запускаем Next.js в production режиме
  const appProcess = spawn(nextBinPath, ['start', '--port', PORT.toString()], {
    cwd: packageDir,
    stdio: 'inherit',
    shell: true
  });
  
  // Ждем запуска сервера
  await waitForServer(`http://localhost:${PORT}`);
  
  console.log(`\n✨ Code Consolidator UI is running at http://localhost:${PORT}`);
  console.log('Use Ctrl+C to stop the application\n');
  
  // Обработка завершения процесса
  appProcess.on('close', (code) => {
    console.log(`Code Consolidator UI stopped with code ${code}`);
    process.exit(code || 0);
  });
  
  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('\nStopping Code Consolidator UI...');
    appProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\nStopping Code Consolidator UI...');
    appProcess.kill('SIGTERM');
  });
}

// Запускаем приложение
startApp().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});