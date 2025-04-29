import { NextResponse } from 'next/server';
import { generatePdf } from '@/server/generate-pdf';

export async function POST(request: Request) {
  try {
    const { files, outputFile, includeComments, newPageForEachFile, useAbsolutePaths } = await request.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files selected' }, 
        { status: 400 }
      );
    }
    
    const pdfPath = await generatePdf({
      files,
      outputFile: outputFile || 'project_code.pdf',
      includeComments: includeComments ?? true,
      newPageForEachFile: newPageForEachFile ?? true,
      useAbsolutePaths: useAbsolutePaths ?? true
    });
    
    return NextResponse.json({ success: true, pdfPath });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    );
  }
}