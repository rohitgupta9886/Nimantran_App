// Transparent 1x1 base64 image placeholder for CORS fallbacks
const TRANSPARENT_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Bulletproof Canvas Fallback Generator
 */
export const createCanvasCardFallback = (
  title = 'Milestone Birthday Celebration',
  shloka = '|| श्री गणेशाय नमः ||',
  hindiText = 'सपरिवार सादर निमंत्रण',
  englishText = 'Together with our families, we cordially request your gracious presence.',
  dateStr = '18 August 2026 | 07:00 PM',
  venueStr = 'Grand Celebration Banquet Hall',
  hostStr = 'Gupta & Sharma Families',
  guestName = 'Priyanka Ji,'
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background Royal Midnight Navy Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 1600);
  bgGradient.addColorStop(0, '#0F0918');
  bgGradient.addColorStop(0.3, '#1E0E2E');
  bgGradient.addColorStop(0.7, '#150A22');
  bgGradient.addColorStop(1, '#0B0514');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 1600);

  // Outer Gold Border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, 1128, 1528);

  // Inner Gold Filigree Frame
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, 1096, 1496);

  // Header Shloka
  ctx.fillStyle = '#E5C07B';
  ctx.font = 'bold 34px serif';
  ctx.textAlign = 'center';
  ctx.fillText(shloka || '|| श्री गणेशाय नमः ||', 600, 140);

  // Subheader
  ctx.fillStyle = '#E2D5C3';
  ctx.font = '28px serif';
  ctx.fillText('सपरिवार सादर निमंत्रण', 600, 200);

  // Guest Name (in elegant cursive / serif font)
  ctx.fillStyle = '#FFDF79';
  ctx.font = 'italic bold 56px serif';
  ctx.fillText(guestName || 'Priyanka Ji,', 600, 290);

  // Host Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '32px serif';
  ctx.fillText(hostStr || 'Gupta & Sharma Families', 600, 360);

  // Warm invitation line
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '26px sans-serif';
  ctx.fillText('के पावन अवसर पर आपकी गरिमामयी', 600, 420);
  ctx.fillText('उपस्थिति सहर्ष प्रार्थनीय है।', 600, 465);

  // Divider with lantern embellishments
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 520);
  ctx.lineTo(950, 520);
  ctx.stroke();

  // Event Title (Milestone / Wedding)
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'italic bold 48px serif';
  ctx.fillText(title || 'Milestone Birthday Celebration', 600, 600);

  // Date & Venue Details Box
  ctx.fillStyle = 'rgba(30, 15, 45, 0.7)';
  ctx.beginPath();
  ctx.roundRect(140, 670, 920, 160, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`🗓️  ${dateStr || '18 August 2026 | 07:00 PM'}`, 600, 735);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '26px sans-serif';
  ctx.fillText(`📍  ${venueStr || 'Grand Celebration Banquet Hall'}`, 600, 795);

  // Emotional touch footer quote
  ctx.fillStyle = '#E2D5C3';
  ctx.font = 'italic 26px serif';
  ctx.fillText('आपकी उपस्थिति हमारे लिए अनमोल है और', 600, 910);
  ctx.fillText('इस खास दिन को और भी यादगार बनाएगी।', 600, 955);

  // 🌟 PROMINENT CLICKABLE CTA BUTTON MOCKUP 🌟
  ctx.fillStyle = '#E5C07B';
  ctx.beginPath();
  ctx.roundRect(180, 1020, 840, 95, 47);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#1A0E2E';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('🎁  Click here To open Invitation  ›', 600, 1080);

  // Quick Action Chips Row
  const chipY = 1170;
  const chipW = 260;
  const chipH = 65;

  // Calendar Chip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(170, chipY, chipW, chipH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.stroke();
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('🗓️ Calendar', 300, chipY + 42);

  // Location Chip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(470, chipY, chipW, chipH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.stroke();
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('📍 Location', 600, chipY + 42);

  // RSVP Chip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(770, chipY, chipW, chipH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.stroke();
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('❤️ RSVP', 900, chipY + 42);

  // Timestamp
  ctx.fillStyle = '#94A3B8';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('2:54 PM ✓✓', 1080, 1310);

  return canvas;
};

/**
 * Downloads a DOM element as a high-resolution PNG image (.png)
 */
export const downloadCardAsPng = async (element: HTMLElement, filename = 'invitation-card.png') => {
  try {
    let dataUrl = '';
    try {
      const { toPng } = await import('html-to-image');
      dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: false,
        imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) return false;
          return true;
        },
      });
    } catch (corsErr) {
      console.warn('html-to-image CORS warning, rendering canvas fallback:', corsErr);
      const fallbackCanvas = createCanvasCardFallback();
      dataUrl = fallbackCanvas.toDataURL('image/png');
    }

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error('Failed to download PNG:', error);
    // Ultimate canvas fallback
    const fallbackCanvas = createCanvasCardFallback();
    const dataUrl = fallbackCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  }
};

/**
 * Downloads a DOM element as a high-quality JPEG image (.jpg)
 */
export const downloadCardAsJpeg = async (element: HTMLElement, filename = 'invitation-card.jpg') => {
  try {
    let dataUrl = '';
    try {
      const { toJpeg } = await import('html-to-image');
      dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: false,
        backgroundColor: '#0D0205',
        imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) return false;
          return true;
        },
      });
    } catch (corsErr) {
      console.warn('html-to-image CORS warning, rendering canvas fallback:', corsErr);
      const fallbackCanvas = createCanvasCardFallback();
      dataUrl = fallbackCanvas.toDataURL('image/jpeg', 0.95);
    }

    const link = document.createElement('a');
    link.download = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error('Failed to download JPEG:', error);
    const fallbackCanvas = createCanvasCardFallback();
    const dataUrl = fallbackCanvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`;
    link.href = dataUrl;
    link.click();
    return true;
  }
};

/**
 * Downloads a DOM element as a PDF document (.pdf)
 */
export const downloadCardAsPdf = async (element: HTMLElement, filename = 'invitation-card.pdf', publicUrl?: string) => {
  try {
    let dataUrl = '';
    try {
      const { toPng } = await import('html-to-image');
      dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: false,
        imagePlaceholder: TRANSPARENT_PLACEHOLDER,
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) return false;
          return true;
        },
      });
    } catch (corsErr) {
      console.warn('html-to-image CORS warning for PDF, rendering canvas fallback:', corsErr);
      const fallbackCanvas = createCanvasCardFallback();
      dataUrl = fallbackCanvas.toDataURL('image/png');
    }

    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 12;
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
    const targetUrl = publicUrl || window.location.href;
    pdf.link(x, y, width, height, { url: targetUrl });

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
};
