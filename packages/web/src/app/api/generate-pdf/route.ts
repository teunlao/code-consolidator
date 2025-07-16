import { NextResponse } from 'next/server';
import { generatePdf } from '@/server/generate-pdf';
import { generateMarkdown } from '@/server/generate-markdown';

export async function POST(request: Request) {
  try {
    const { files, outputFile, includeComments, newPageForEachFile, useAbsolutePaths, outputFormat } = await request.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files selected' }, 
        { status: 400 }
      );
    }
    
    let finalOutputFile = outputFile || 'project_code';
    const extension = outputFormat === 'markdown' ? '.md' : '.pdf';

    if (!finalOutputFile.toLowerCase().endsWith(extension)) {
      finalOutputFile = finalOutputFile.replace(/\.(pdf|md)$/i, '') + extension;
    }

    let resultPath: string;

    if (outputFormat === 'markdown') {
      resultPath = await generateMarkdown({
        files,
        outputFile: finalOutputFile,
        includeComments: includeComments ?? true,
        useAbsolutePaths: useAbsolutePaths ?? true,
      });
    } else {
      resultPath = await generatePdf({
        files,
        outputFile: finalOutputFile,
        includeComments: includeComments ?? true,
        newPageForEachFile: newPageForEachFile ?? true,
        useAbsolutePaths: useAbsolutePaths ?? true
      });
    }
    
    return NextResponse.json({ success: true, pdfPath: resultPath });
  } catch (error) {
    console.error('Error generating output:', error);
    return NextResponse.json(
      { error: 'Failed to generate output' }, 
      { status: 500 }
    );
  }
}