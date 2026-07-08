import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Response } from 'express';

interface CertificateData {
  studentName: string;
  registrationNumber: string;
  department: string;
  eventTitle: string;
  eventCategory: string;
  eventDate: string;
  registrationId: string;
  isWinner?: boolean;
  place?: string;
}

export const generateCertificatePDF = async (res: Response, data: CertificateData) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40
      });

      // Stream PDF directly to Express response
      doc.pipe(res);

      const verificationUrl = `http://localhost:5173/verify/${data.registrationId}`;

      // Generate Verification QR Code
      const qrDataUri = await QRCode.toDataURL(verificationUrl, { margin: 1 });
      const qrBuffer = Buffer.from(qrDataUri.split(',')[1], 'base64');

      // --- Background & Border Styling ---
      const width = doc.page.width;
      const height = doc.page.height;

      // Primary Outer border
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(3)
         .stroke('#6366f1');

      // Secondary Inner border
      doc.rect(26, 26, width - 52, height - 52)
         .lineWidth(1)
         .stroke('#06b6d4');

      // Corner Decorative Accent Triangles
      // Top Left Accent
      doc.moveTo(20, 50).lineTo(50, 20).lineTo(20, 20).fill('#6366f1');
      // Top Right Accent
      doc.moveTo(width - 20, 50).lineTo(width - 50, 20).lineTo(width - 20, 20).fill('#6366f1');
      // Bottom Left Accent
      doc.moveTo(20, height - 50).lineTo(50, height - 20).lineTo(20, height - 20).fill('#6366f1');
      // Bottom Right Accent
      doc.moveTo(width - 20, height - 50).lineTo(width - 50, height - 20).lineTo(width - 20, height - 20).fill('#6366f1');

      // --- Certificate Text ---
      doc.fillColor('#111827');

      // Header: CampusHub
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .text('CAMPUSHUB PLATFORM', { align: 'center' });

      doc.moveDown(0.5);
      
      // Subtitle
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text('COLLEGE EVENT MANAGEMENT & RECOGNITION', { align: 'center', characterSpacing: 2 });

      doc.moveDown(1.5);

      // Certificate Title
      doc.fontSize(36)
         .font('Helvetica-Bold')
         .fillColor('#1f2937')
         .text(data.isWinner ? 'CERTIFICATE OF MERIT' : 'CERTIFICATE OF PARTICIPATION', { align: 'center' });

      doc.moveDown(1.2);

      // Text block: This is to certify...
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text('This is proudly presented to', { align: 'center' });

      doc.moveDown(0.8);

      // Student Name (Styled prominently)
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#6366f1')
         .text(data.studentName.toUpperCase(), { align: 'center' });

      // Student details line
      doc.moveDown(0.4);
      doc.fontSize(12)
         .font('Helvetica-Oblique')
         .fillColor('#4b5563')
         .text(`Reg No: ${data.registrationNumber}  |  Dept: ${data.department}`, { align: 'center' });

      doc.moveDown(1.0);

      // Event participation text
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text(data.isWinner 
           ? `for actively participating and securing ${data.place} Place in the event` 
           : `for actively participating and successfully completing the event`, { align: 'center' });

      doc.moveDown(0.6);

      // Event Title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#06b6d4')
         .text(`"${data.eventTitle}"`, { align: 'center' });

      doc.moveDown(0.4);

      // Event Date
      const formattedDate = new Date(data.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.fontSize(13)
         .font('Helvetica')
         .fillColor('#64748b')
         .text(`Held on ${formattedDate}`, { align: 'center' });

      // --- Bottom Section: Signatures & QR Verification ---
      
      const bottomY = height - 120;
      
      // Left: HOD Signature Area
      const leftSigX = 60;
      doc.moveTo(leftSigX, bottomY + 30)
         .lineTo(leftSigX + 160, bottomY + 30)
         .lineWidth(1)
         .stroke('#cbd5e1');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#64748b')
         .text('HOD INFORMATION TECHNOLOGY', leftSigX, bottomY + 38, { width: 160, align: 'center' });

      // Center: Verification QR Code & ID
      const centerX = width / 2;
      doc.image(qrBuffer, centerX - 35, bottomY - 10, { width: 70 });
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#9ca3af')
         .text(`ID: ${data.registrationId}`, centerX - 70, bottomY + 65, { width: 140, align: 'center' });

      // Right: Principal Signature Area
      const rightSigX = width - 200;
      
      doc.moveTo(rightSigX, bottomY + 30)
         .lineTo(rightSigX + 140, bottomY + 30)
         .lineWidth(1)
         .stroke('#cbd5e1');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#64748b')
         .text('PRINCIPAL', rightSigX, bottomY + 38, { width: 140, align: 'center' });

      // Finalize document and close stream
      doc.end();
      resolve();
    } catch (error) {
      console.error('Error generating Certificate PDF:', error);
      reject(error);
    }
  });
};
