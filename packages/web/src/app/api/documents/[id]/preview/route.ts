import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // In a real app, this would:
    // 1. Fetch document metadata from database
    // 2. Get file from Supabase Storage or S3
    // 3. Stream the file content back
    
    // For now, return a sample PDF or placeholder
    if (id === '1' || id === '2' || id === '4') {
      // Return a simple PDF placeholder
      const pdfContent = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(Sample Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000185 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
279
%%EOF`);

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="document-${id}.pdf"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // For image documents, return a placeholder image
    if (id === '3') {
      // Return a 1x1 pixel PNG placeholder
      const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      return new NextResponse(pngData, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `inline; filename="photo-${id}.png"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // For other documents, return placeholder content
    return new NextResponse('Document content not available', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error('Document preview error:', error);
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}