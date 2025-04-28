// Модуль для работы с PDF
import * as fs from 'fs';
import * as path from 'path';

// Простая обертка для работы с PDF без прямых импортов библиотек
export interface PdfGeneratorOptions {
  outputPath: string;
}

export class PdfGenerator {
  private doc: any;
  private stream!: fs.WriteStream;
  
  constructor(options: PdfGeneratorOptions) {
    // Проверяем и создаем директорию для выходного файла если необходимо
    const outputDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }
  
  async initialize(outputPath: string): Promise<void> {
    try {
      // Используем более безопасный подход для динамического импорта
      // @ts-ignore - игнорируем ошибки типизации для динамического импорта
      const pdfkit = await import('pdfkit').catch(e => {
        console.error('Error importing pdfkit:', e);
        throw e;
      });
      
      // Создаем документ
      this.doc = new pdfkit.default();
      this.stream = fs.createWriteStream(outputPath);
      this.doc.pipe(this.stream);
    } catch (error) {
      console.error('Ошибка при инициализации PDF:', error);
      throw error;
    }
  }
  
  addHeading(text: string): void {
    this.doc.fontSize(14).text(text, { underline: true });
    this.doc.moveDown();
  }
  
  addContent(text: string): void {
    this.doc.fontSize(10).text(text);
  }
  
  addNewPage(): void {
    this.doc.addPage();
  }
  
  addSpace(lines: number = 2): void {
    this.doc.moveDown(lines);
  }
  
  async end(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.stream.on('finish', () => {
        resolve();
      });
      
      this.stream.on('error', (err) => {
        reject(err);
      });
      
      this.doc.end();
    });
  }
}