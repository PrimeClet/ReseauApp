import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Download, X } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  title: string;
}

export default function QRCodeModal({ 
  open, 
  onOpenChange, 
  qrCode,
  title 
}: QRCodeModalProps) {
  if (!qrCode) return null;

  const handleDownload = () => {
    // Créer un blob à partir du SVG
    const blob = new Blob([qrCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-code-${title.replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div 
            className="bg-white p-4 rounded-lg border border-border"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
          
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

