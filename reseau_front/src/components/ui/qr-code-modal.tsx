import { Dialog, DialogContent } from "./dialog";
import { Button } from "./button";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";

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
  const cardRef = useRef<HTMLDivElement>(null);

  if (!qrCode) return null;

  // Couleurs selon le type (style cartographie)
  const colors = {
    coffret: {
      primary: '#10b981', // Vert emerald
      secondary: '#d1fae5',
      border: '#6ee7b7',
      status: '#22c55e'
    },
    equipement: {
      primary: '#3b82f6', // Bleu
      secondary: '#dbeafe',
      border: '#93c5fd',
      status: '#22c55e'
    }
  };

  const currentColors = colors[type];

  // Générer le SVG complet style noeud cartographique
  const generateFullSVG = () => {
    const iconPath = type === 'equipement'
      ? `<path d="M2 6h20v12H2z" stroke="${currentColors.primary}" stroke-width="1.5" fill="none" rx="2"/>
         <line x1="6" y1="10" x2="6" y2="14" stroke="${currentColors.primary}" stroke-width="1.5"/>
         <line x1="10" y1="10" x2="10" y2="14" stroke="${currentColors.primary}" stroke-width="1.5"/>
         <line x1="14" y1="10" x2="14" y2="14" stroke="${currentColors.primary}" stroke-width="1.5"/>
         <line x1="18" y1="10" x2="18" y2="14" stroke="${currentColors.primary}" stroke-width="1.5"/>`
      : `<rect x="2" y="4" width="20" height="16" rx="2" stroke="${currentColors.primary}" stroke-width="1.5" fill="none"/>
         <line x1="6" y1="8" x2="18" y2="8" stroke="${currentColors.primary}" stroke-width="1.5"/>
         <circle cx="6" cy="12" r="1.5" fill="${currentColors.status}"/>
         <circle cx="10" cy="12" r="1.5" fill="${currentColors.status}"/>
         <circle cx="14" cy="12" r="1.5" fill="#f59e0b"/>
         <circle cx="18" cy="12" r="1.5" fill="${currentColors.status}"/>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="440" viewBox="0 0 340 440">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fafafa"/>
      <stop offset="100%" style="stop-color:#f5f5f5"/>
    </linearGradient>
  </defs>

  <!-- Carte principale style noeud cartographique -->
  <g filter="url(#shadow)">
    <!-- Fond de la carte -->
    <rect x="20" y="20" width="300" height="400" rx="12" fill="white" stroke="${currentColors.border}" stroke-width="2"/>

    <!-- Header avec icône style cartographie -->
    <rect x="20" y="20" width="300" height="80" rx="12" fill="url(#headerGrad)"/>
    <rect x="20" y="88" width="300" height="12" fill="url(#headerGrad)"/>
    <line x1="20" y1="100" x2="320" y2="100" stroke="${currentColors.border}" stroke-width="1"/>

    <!-- Icône dans un cercle style noeud -->
    <circle cx="70" cy="60" r="28" fill="${currentColors.secondary}" stroke="${currentColors.primary}" stroke-width="2"/>
    <g transform="translate(58, 48)">
      <svg width="24" height="24" viewBox="0 0 24 24">
        ${iconPath}
      </svg>
    </g>

    <!-- Indicateur de status -->
    <circle cx="90" cy="42" r="6" fill="${currentColors.status}" stroke="white" stroke-width="2"/>

    <!-- Titre et sous-titre -->
    <text x="115" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#1f2937">${title.substring(0, 20)}${title.length > 20 ? '...' : ''}</text>
    <text x="115" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#6b7280">${subtitle?.substring(0, 28) || (type === 'equipement' ? 'Équipement réseau' : 'Armoire réseau')}</text>

    <!-- Zone QR Code avec fond coloré -->
    <rect x="35" y="115" width="270" height="270" rx="8" fill="${currentColors.secondary}"/>
    <rect x="45" y="125" width="250" height="250" rx="6" fill="white"/>

    <!-- QR Code -->
    <g transform="translate(55, 135) scale(0.77)">
      ${qrCode.replace(/<\?xml[^?]*\?>/g, '').replace(/<svg[^>]*>/g, '').replace(/<\/svg>/g, '')}
    </g>

    <!-- Badge du code -->
    <rect x="95" y="395" width="150" height="28" rx="14" fill="${currentColors.secondary}" stroke="${currentColors.border}" stroke-width="1"/>
    <text x="170" y="414" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13" font-weight="600" fill="${currentColors.primary}">${code || ''}</text>
  </g>

  <!-- Points de connexion style cartographie -->
  <circle cx="20" cy="170" r="5" fill="${currentColors.primary}"/>
  <circle cx="320" cy="170" r="5" fill="${currentColors.primary}"/>
  <circle cx="170" cy="20" r="5" fill="${currentColors.primary}"/>
  <circle cx="170" cy="420" r="5" fill="${currentColors.primary}"/>
</svg>`;
  };

  const handleDownloadSVG = () => {
    const svg = generateFullSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
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
      canvas.width = 340;
      canvas.height = 440;

      if (ctx) {
        // Fond
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Carte
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = currentColors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(20, 20, 300, 400, 12);
        ctx.fill();
        ctx.stroke();

        // Header
        ctx.fillStyle = '#fafafa';
        ctx.beginPath();
        ctx.roundRect(20, 20, 300, 80, [12, 12, 0, 0]);
        ctx.fill();

        // Ligne séparatrice
        ctx.strokeStyle = currentColors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, 100);
        ctx.lineTo(320, 100);
        ctx.stroke();

        // Cercle icône
        ctx.fillStyle = currentColors.secondary;
        ctx.strokeStyle = currentColors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(70, 60, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Status indicator
        ctx.fillStyle = currentColors.status;
        ctx.beginPath();
        ctx.arc(90, 42, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Titre
        ctx.fillStyle = '#1f2937';
        ctx.font = '600 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title.substring(0, 20) + (title.length > 20 ? '...' : ''), 115, 52);

        // Sous-titre
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillText(subtitle?.substring(0, 28) || (type === 'equipement' ? 'Équipement réseau' : 'Armoire réseau'), 115, 72);

        // Zone QR
        ctx.fillStyle = currentColors.secondary;
        ctx.beginPath();
        ctx.roundRect(35, 115, 270, 270, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(45, 125, 250, 250, 6);
        ctx.fill();

        // QR Code
        ctx.drawImage(img, 55, 135, 230, 230);

        // Badge code
        ctx.fillStyle = currentColors.secondary;
        ctx.strokeStyle = currentColors.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(95, 395, 150, 28, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentColors.primary;
        ctx.font = '600 13px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(code || '', 170, 414);

        // Points de connexion
        ctx.fillStyle = currentColors.primary;
        ctx.beginPath();
        ctx.arc(20, 170, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(320, 170, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(170, 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(170, 420, 5, 0, Math.PI * 2);
        ctx.fill();

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
    const printWindow = window.open('', '', 'width=400,height=550');
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
              background: #f5f5f5;
              padding: 20px;
            }
            .card {
              width: 300px;
              background: white;
              border-radius: 12px;
              border: 2px solid ${currentColors.border};
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              position: relative;
            }
            .header {
              padding: 16px;
              background: linear-gradient(to bottom, #fafafa, #f5f5f5);
              border-bottom: 1px solid ${currentColors.border};
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .icon-circle {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background: ${currentColors.secondary};
              border: 2px solid ${currentColors.primary};
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .status-dot {
              position: absolute;
              top: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${currentColors.status};
              border: 2px solid white;
            }
            .info h2 {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .info p {
              font-size: 12px;
              color: #6b7280;
            }
            .qr-section {
              padding: 16px;
              background: ${currentColors.secondary};
            }
            .qr-container {
              background: white;
              border-radius: 6px;
              padding: 12px;
              display: flex;
              justify-content: center;
            }
            .qr-container svg {
              width: 200px;
              height: 200px;
            }
            .footer {
              padding: 16px;
              text-align: center;
            }
            .code-badge {
              display: inline-block;
              background: ${currentColors.secondary};
              border: 1px solid ${currentColors.border};
              padding: 8px 20px;
              border-radius: 14px;
              font-family: ui-monospace, monospace;
              font-size: 13px;
              font-weight: 600;
              color: ${currentColors.primary};
            }
            .connection-point {
              position: absolute;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: ${currentColors.primary};
            }
            .point-left { left: -5px; top: 50%; transform: translateY(-50%); }
            .point-right { right: -5px; top: 50%; transform: translateY(-50%); }
            .point-top { top: -5px; left: 50%; transform: translateX(-50%); }
            .point-bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
            @media print {
              body { background: white; padding: 0; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="connection-point point-left"></div>
            <div class="connection-point point-right"></div>
            <div class="connection-point point-top"></div>
            <div class="connection-point point-bottom"></div>
            <div class="header">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${currentColors.primary}" stroke-width="1.5">
                  ${type === 'equipement'
                    ? `<rect x="2" y="6" width="20" height="12" rx="2"/>
                       <line x1="6" y1="10" x2="6" y2="14"/>
                       <line x1="10" y1="10" x2="10" y2="14"/>
                       <line x1="14" y1="10" x2="14" y2="14"/>
                       <line x1="18" y1="10" x2="18" y2="14"/>`
                    : `<rect x="2" y="4" width="20" height="16" rx="2"/>
                       <line x1="6" y1="8" x2="18" y2="8"/>`
                  }
                </svg>
                <div class="status-dot"></div>
              </div>
              <div class="info">
                <h2>${title}</h2>
                <p>${subtitle || (type === 'equipement' ? 'Équipement réseau' : 'Armoire réseau')}</p>
              </div>
            </div>
            <div class="qr-section">
              <div class="qr-container">
                ${qrCode}
              </div>
            </div>
            <div class="footer">
              <span class="code-badge">${code || ''}</span>
            </div>
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
      <DialogContent className="max-w-[360px] p-0 overflow-visible bg-transparent border-0 shadow-none">
        {/* Carte style noeud cartographique */}
        <div ref={cardRef} className="relative">
          {/* Points de connexion style carte réseau */}
          <div
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{ backgroundColor: currentColors.primary }}
          />
          <div
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{ backgroundColor: currentColors.primary }}
          />
          <div
            className="absolute left-1/2 -top-2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{ backgroundColor: currentColors.primary }}
          />
          <div
            className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 rounded-full"
            style={{ backgroundColor: currentColors.primary }}
          />

          <div
            className="bg-white rounded-xl overflow-hidden shadow-xl"
            style={{ border: `2px solid ${currentColors.border}` }}
          >
            {/* Header style noeud */}
            <div
              className="p-4 flex items-center gap-3"
              style={{
                background: 'linear-gradient(to bottom, #fafafa, #f5f5f5)',
                borderBottom: `1px solid ${currentColors.border}`
              }}
            >
              {/* Icône dans cercle avec status */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: currentColors.secondary,
                    border: `2px solid ${currentColors.primary}`
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={currentColors.primary} strokeWidth="1.5">
                    {type === 'equipement' ? (
                      <>
                        <rect x="2" y="6" width="20" height="12" rx="2"/>
                        <line x1="6" y1="10" x2="6" y2="14"/>
                        <line x1="10" y1="10" x2="10" y2="14"/>
                        <line x1="14" y1="10" x2="14" y2="14"/>
                        <line x1="18" y1="10" x2="18" y2="14"/>
                      </>
                    ) : (
                      <>
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <line x1="6" y1="8" x2="18" y2="8"/>
                        <circle cx="6" cy="12" r="1.5" fill={currentColors.status}/>
                        <circle cx="10" cy="12" r="1.5" fill={currentColors.status}/>
                        <circle cx="14" cy="12" r="1.5" fill="#f59e0b"/>
                        <circle cx="18" cy="12" r="1.5" fill={currentColors.status}/>
                      </>
                    )}
                  </svg>
                </div>
                {/* Status indicator */}
                <div
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: currentColors.status }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 truncate">{title}</h2>
                <p className="text-sm text-gray-500 truncate">
                  {subtitle || (type === 'equipement' ? 'Équipement réseau' : 'Armoire réseau')}
                </p>
              </div>
            </div>

            {/* Zone QR Code */}
            <div className="p-4" style={{ backgroundColor: currentColors.secondary }}>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div
                  className="flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-[200px]"
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />
              </div>
            </div>

            {/* Footer avec code */}
            <div className="p-4 text-center bg-white">
              {code && (
                <span
                  className="inline-block px-5 py-2 rounded-full font-mono font-semibold text-sm"
                  style={{
                    backgroundColor: currentColors.secondary,
                    color: currentColors.primary,
                    border: `1px solid ${currentColors.border}`
                  }}
                >
                  {code}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSVG}
                className="flex-1 text-xs h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPNG}
                className="flex-1 text-xs h-8"
              >
                <Download className="h-3 w-3 mr-1" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1 text-xs h-8"
              >
                <Printer className="h-3 w-3 mr-1" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
