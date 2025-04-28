#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

// Путь к директории пакета
const packageDir = path.resolve(__dirname, '../..');

// Порт для запуска приложения
const PORT = process.env.PORT || 3333;

// Проверяем, что у нас есть собранные файлы
const nextDistDir = path.join(packageDir, '.next');
if (!fs.existsSync(nextDistDir)) {
  console.error('Error: Build files not found in the package.');
  console.error('The package may be corrupted or incorrectly installed.');
  process.exit(1);
}

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
  
  // Запускаем Next.js в production режиме напрямую из директории пакета
  console.log(`Starting server on port ${PORT}...`);
  
  // Сохраняем директорию пользователя
  const userProjectDir = process.cwd();
  console.log(`User project directory: ${userProjectDir}`);
  
  // Используем npx next start с путем к .next директории
  const appProcess = spawn('npx', ['next', 'start', '--port', PORT.toString()], {
    cwd: packageDir, // Используем директорию пакета для запуска next
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production', // Убедимся, что используется production режим
      USER_PROJECT_DIR: userProjectDir // Передаем директорию пользователя как переменную окружения
    }
  });
  
  try {
    // Ждем запуска сервера
    await waitForServer(`http://localhost:${PORT}`);
    
    console.log(`\n✨ Code Consolidator UI is running at http://localhost:${PORT}`);
    console.log('Use Ctrl+C to stop the application\n');
  } catch (error) {
    console.error('Server did not start correctly:', error);
  }
  
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