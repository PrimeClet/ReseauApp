import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Save } from "lucide-react";

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any;
  onSave: (updatedData: any) => void;
  fields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
  }>;
}

export default function EditModal({ 
  open, 
  onOpenChange, 
  title, 
  data, 
  onSave,
  fields
}: EditModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data) {
      setFormData({ ...data });
    }
  }, [data]);

  if (!data) return null;

  const defaultFields = Object.keys(data).map(key => ({
    key,
    label: key.replace(/_/g, ' '),
    type: 'text' as const
  }));

  const formFields = fields || defaultFields;

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {formFields.map(({ key, label, type, options }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium capitalize">
                {label}
              </Label>
              
              {type === 'select' && options ? (
                <Select 
                  value={formData[key]} 
                  onValueChange={(value) => handleChange(key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Sélectionner ${label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={key}
                  type={type === 'number' ? 'number' : 'text'}
                  value={formData[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`Entrer ${label}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}