import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Mock document data
    const documents: Record<string, { name: string; type: string; content: string }> = {
      '1': {
        name: 'Kitchen Plans v3.pdf',
        type: 'application/pdf',
        content: 'Sample PDF content for kitchen plans'
      },
      '2': {
        name: 'Electrical Permit.pdf', 
        type: 'application/pdf',
        content: 'Sample electrical permit document'
      },
      '3': {
        name: 'Progress Photo.jpg',
        type: 'image/jpeg',
        content: 'Sample progress photo'
      },
      '4': {
        name: 'Bathroom Contract.pdf',
        type: 'application/pdf', 
        content: 'Sample bathroom renovation contract'
      },
    };

    const document = documents[id];
    
    if (!document) {
      return new NextResponse('Document not found', { status: 404 });
    }

    // For PDFs, return the same content as preview
    if (document.type === 'application/pdf') {
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
<< /Length 60 >>
stream
BT
/F1 12 Tf
50 700 Td
(${document.content}) Tj
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
295
%%EOF`);

      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': document.type,
          'Content-Disposition': `attachment; filename="${document.name}"`,
        },
      });
    }

    // For images, return placeholder
    if (document.type.startsWith('image/')) {
      const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      return new NextResponse(pngData, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${document.name}"`,
        },
      });
    }

    return new NextResponse(document.content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${document.name}"`,
      },
    });

  } catch (error) {
    console.error('Document download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}