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
    if (data && open) {
      // Réinitialiser les données du formulaire quand le modal s'ouvre avec de nouvelles données
      const initialData: any = {};
      if (fields) {
        fields.forEach(field => {
          // Pour les champs select, garder la valeur telle quelle (même si undefined/null), pour les autres mettre '' si undefined
          if (field.type === 'select') {
            const value = data[field.key];
            // Si la valeur existe mais ne correspond à aucune option, essayer de trouver une correspondance (case-insensitive)
            if (value && field.options) {
              const matchingOption = field.options.find(opt => 
                opt.toLowerCase() === String(value).toLowerCase()
              );
              initialData[field.key] = matchingOption || value;
            } else {
              initialData[field.key] = value !== undefined && value !== null ? value : '';
            }
          } else {
            initialData[field.key] = data[field.key] || '';
          }
        });
      } else {
        Object.assign(initialData, data);
      }
      setFormData(initialData);
    }
  }, [data, open, fields]);

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
                  value={formData[key] && formData[key] !== '' ? String(formData[key]) : undefined} 
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
                  value={formData[key] ?? ''}
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