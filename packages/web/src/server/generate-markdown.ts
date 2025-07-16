import path from 'path';
import fs from 'fs/promises';

const getExtension = (filePath: string): string => {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const determineLanguage = (filePath: string): string => {
  const extension = getExtension(filePath);
  const extensionMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    py: 'python',
    java: 'java',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    md: 'markdown',
    sh: 'bash',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    kt: 'kotlin',
    swift: 'swift',
    sql: 'sql',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  };
  return extensionMap[extension] || '';
};

interface GenerateMarkdownOptions {
  files: string[];
  outputFile: string;
  includeComments: boolean;
  useAbsolutePaths: boolean;
}

function removeComments(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\/+/g, '')
    .replace(/^\s*[\r\n]/gm, '');
}

async function readFileContent(filePath: string, includeComments: boolean): Promise<string> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    if (!includeComments) {
      content = removeComments(content);
    }
    return content;
  } catch (error: any) {
    console.error(`Ошибка при чтении файла ${filePath}: ${error.message}`);
    return '';
  }
}

export async function generateMarkdown({
  files,
  outputFile,
  includeComments,
  useAbsolutePaths,
}: GenerateMarkdownOptions): Promise<string> {
  let markdownContent = '# Code Consolidation Report\n\n';
  markdownContent += `Generated on: ${new Date().toISOString()}\n\n`;

  const userProjectDir = process.env.USER_PROJECT_DIR || process.cwd();

  for (const file of files) {
    const absolutePath = path.resolve(userProjectDir, file);
    const displayPath = useAbsolutePaths ? absolutePath : path.relative(userProjectDir, absolutePath);
    const language = determineLanguage(file);

    markdownContent += `## Content of \`${displayPath}\`\n\n`;
    markdownContent += `\`\`\`${language}\n`;

    const fileContent = await readFileContent(absolutePath, includeComments);
    markdownContent += fileContent;
    markdownContent += '\n```\n\n';
  }

  const absoluteOutputPath = path.isAbsolute(outputFile) ? outputFile : path.resolve(userProjectDir, outputFile);

  // Создаем директорию для выходного файла, если она не существует
  const outputDir = path.dirname(absoluteOutputPath);
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Игнорируем ошибку, если директория уже существует
  }

  await fs.writeFile(absoluteOutputPath, markdownContent, 'utf-8');

  console.log(`Markdown file created: ${absoluteOutputPath}`);
  return absoluteOutputPath;
}
