import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { createCanvasCardFallback } from './cardExport';

interface ShareOptions {
  element: HTMLElement;
  format: 'JPEG' | 'PDF';
  recipientPhone?: string;
  guestName?: string;
  eventTitle?: string;
  captionText?: string;
}

const TRANSPARENT_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Bulletproof WhatsApp AI Card Sharing:
 * 1. Converts DOM Card to JPEG/PNG Blob (with HTML5 Canvas fallback if CORS fails).
 * 2. Copies JPEG Image directly to System Clipboard for Ctrl+V paste on Desktop.
 * 3. Triggers Web Share API with attached File on mobile / modern devices.
 */
export const shareAiCardToWhatsApp = async ({
  element,
  format,
  recipientPhone = '',
  guestName = 'Guest',
  eventTitle = 'Event',
  captionText = '',
}: ShareOptions): Promise<{ method: 'NATIVE_SHARE' | 'CLIPBOARD_PASTE' | 'DOWNLOAD_FALLBACK'; message: string }> => {
  const filename = `${eventTitle}-${guestName}`.toLowerCase().replace(/[^a-z0-9]/g, '-') + (format === 'PDF' ? '.pdf' : '.jpg');
  let file: File;
  let pngBlobForClipboard: Blob | null = null;

  try {
    if (format === 'PDF') {
      let dataUrl = '';
      try {
        dataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: 2,
          cacheBust: false,
          imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        });
      } catch (err) {
        console.warn('DOM render error, using canvas fallback for PDF:', err);
        const fallbackCanvas = createCanvasCardFallback(eventTitle, '|| श्री गणेशाय नमः ||', '', captionText);
        dataUrl = fallbackCanvas.toDataURL('image/png');
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxW = pdfWidth - margin * 2;
      const maxH = pdfHeight - margin * 2;
      let width = maxW;
      let height = (imgProps.height * maxW) / imgProps.width;

      if (height > maxH) {
        height = maxH;
        width = (imgProps.width * maxH) / imgProps.height;
      }

      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.setFillColor(13, 2, 5);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.addImage(dataUrl, 'PNG', x, y, width, height);

      // Add interactive PDF hyperlink annotation over the card image button region
      const linkMatch = captionText.match(/https?:\/\/[^\s]+/);
      const targetUrl = linkMatch ? linkMatch[0] : window.location.href;
      pdf.link(x, y, width, height, { url: targetUrl });

      const pdfBlob = pdf.output('blob');
      file = new File([pdfBlob], filename, { type: 'application/pdf' });
    } else {
      // JPEG Format Generation
      let jpegDataUrl = '';
      let pngDataUrl = '';

      try {
        pngDataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: 2,
          cacheBust: false,
          imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        });
        jpegDataUrl = await toJpeg(element, {
          quality: 0.95,
          pixelRatio: 2,
          cacheBust: false,
          backgroundColor: '#0D0205',
          imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        });
      } catch (err) {
        console.warn('DOM render error, using canvas fallback for JPEG:', err);
        const fallbackCanvas = createCanvasCardFallback(eventTitle, '|| श्री गणेशाय नमः ||', '', captionText);
        pngDataUrl = fallbackCanvas.toDataURL('image/png');
        jpegDataUrl = fallbackCanvas.toDataURL('image/jpeg', 0.95);
      }

      const pngRes = await fetch(pngDataUrl);
      pngBlobForClipboard = await pngRes.blob();

      const jpegRes = await fetch(jpegDataUrl);
      const jpegBlob = await jpegRes.blob();
      file = new File([jpegBlob], filename, { type: 'image/jpeg' });
    }

    // 1. System Clipboard Copy for JPEG Image (allows Ctrl+V paste on WhatsApp Web!)
    let copiedToClipboard = false;
    if (format === 'JPEG' && pngBlobForClipboard && navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlobForClipboard,
          }),
        ]);
        copiedToClipboard = true;
      } catch (clipErr) {
        console.warn('Clipboard image copy not supported by browser:', clipErr);
      }
    }

    // 2. Attempt Web Share API with Attached File (Mobile / Supported Browsers)
    const shareData: ShareData = {
      files: [file],
      title: `${eventTitle} Invitation`,
      text: captionText || `✨ AI Generated Invitation Card for ${guestName}!`,
    };

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share(shareData);
        return {
          method: 'NATIVE_SHARE',
          message: `Shared AI ${format} Card directly to WhatsApp!`,
        };
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { method: 'NATIVE_SHARE', message: 'WhatsApp share cancelled.' };
        }
      }
    }

    // 3. Desktop / Web Fallback: Download file + open WhatsApp Web window
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = filename;
    link.click();

    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(captionText || '');
    const waUrl = phoneWithCountry
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(waUrl, '_blank');

    if (copiedToClipboard) {
      return {
        method: 'CLIPBOARD_PASTE',
        message: `📸 AI JPEG Card copied to clipboard! Press Ctrl+V in WhatsApp to paste the image card!`,
      };
    } else {
      return {
        method: 'DOWNLOAD_FALLBACK',
        message: `AI ${format} Card downloaded (${filename})! Attach the file in the opened WhatsApp window.`,
      };
    }
  } catch (error: any) {
    console.error('WhatsApp AI Card sharing error:', error);
    // Bulletproof Fallback: Generate canvas file & download directly
    const fallbackCanvas = createCanvasCardFallback(eventTitle, '|| श्री गणेशाय नमः ||', '', captionText);
    const dataUrl = fallbackCanvas.toDataURL(format === 'PDF' ? 'image/png' : 'image/jpeg', 0.95);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encodedText = encodeURIComponent(captionText || '');
    const waUrl = phoneWithCountry
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');

    return {
      method: 'DOWNLOAD_FALLBACK',
      message: `AI ${format} Card saved! Attach ${filename} in WhatsApp.`,
    };
  }
};
