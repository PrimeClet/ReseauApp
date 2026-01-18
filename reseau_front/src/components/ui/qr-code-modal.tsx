import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Download, Printer } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  title: string;
  subtitle?: string;
  type?: 'coffret' | 'equipement';
  code?: string;
}

export default function QRCodeModal({
  open,
  onOpenChange,
  qrCode,
  title,
  subtitle,
  type = 'coffret',
  code
}: QRCodeModalProps) {
  if (!qrCode) return null;

  const handleDownloadSVG = () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380">
  <rect width="300" height="380" fill="white"/>
  <text x="150" y="30" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2937">${title}</text>
  ${subtitle ? `<text x="150" y="50" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#6b7280">${subtitle}</text>` : ''}
  <g transform="translate(25, 70)">
    ${qrCode.replace(/<\?xml[^?]*\?>/g, '').replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '')}
  </g>
  ${code ? `<text x="150" y="360" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" font-weight="600" fill="#3b82f6">${code}</text>` : ''}
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${code || title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([qrCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 380;

      if (ctx) {
        // Fond blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Titre
        ctx.fillStyle = '#1f2937';
        ctx.font = '600 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, 150, 30);

        // Sous-titre
        if (subtitle) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '12px system-ui, -apple-system, sans-serif';
          ctx.fillText(subtitle, 150, 50);
        }

        // QR Code
        ctx.drawImage(img, 25, 70, 250, 250);

        // Code
        if (code) {
          ctx.fillStyle = '#3b82f6';
          ctx.font = '600 14px ui-monospace, monospace';
          ctx.fillText(code, 150, 360);
        }

        // Télécharger
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `qr-${code || title.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=400,height=500');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${code || title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .card {
              text-align: center;
              padding: 24px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: white;
            }
            .title {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 16px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin-bottom: 16px;
            }
            .qr-container svg {
              width: 200px;
              height: 200px;
            }
            .code {
              font-family: ui-monospace, monospace;
              font-size: 16px;
              font-weight: 600;
              color: #3b82f6;
            }
            @media print {
              body { padding: 0; }
              .card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">${title}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
            <div class="qr-container">
              ${qrCode}
            </div>
            ${code ? `<div class="code">${code}</div>` : ''}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
          )}
        </DialogHeader>

        {/* QR Code */}
        <div className="flex justify-center py-4">
          <div
            className="bg-white p-4 rounded-lg border [&>svg]:w-48 [&>svg]:h-48"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
        </div>

        {/* Code */}
        {code && (
          <div className="text-center">
            <span className="font-mono font-semibold text-primary">{code}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSVG}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPNG}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
