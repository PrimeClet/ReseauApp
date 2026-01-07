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
    type: 'text' | 'select' | 'number' | 'file';
    options?: string[];
  }>;
  className?: string;
}

export default function EditModal({ 
  open, 
  onOpenChange, 
  title, 
  data, 
  onSave,
  fields,
  className
}: EditModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data && open) {
      // Réinitialiser les données du formulaire quand le modal s'ouvre avec de nouvelles données
      const initialData: any = {};
      if (fields) {
        fields.forEach(field => {
          // Pour les champs file, ne pas pré-remplir (on ne peut pas pré-remplir un input file)
          if (field.type === 'file') {
            initialData[field.key] = undefined;
          } else if (field.type === 'select') {
            const value = data[field.key];
            // Si la valeur existe mais ne correspond à aucune option, essayer de trouver une correspondance (case-insensitive)
            if (value !== undefined && value !== null && field.options) {
              const valueStr = String(value);
              const matchingOption = field.options.find(opt => 
                opt === valueStr || opt.toLowerCase() === valueStr.toLowerCase()
              );
              initialData[field.key] = matchingOption || valueStr;
            } else {
              // Garder undefined au lieu de chaîne vide pour les valeurs null/undefined
              initialData[field.key] = value !== undefined && value !== null ? String(value) : undefined;
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
    const payload = data && data.id !== undefined
      ? { id: data.id, ...formData }
      : formData;
    onSave(payload);
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
      <DialogContent className={className || "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {formFields.map(({ key, label, type, options }) => (
            <div key={key} className={type === 'file' ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
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
              ) : type === 'file' ? (
                <Input
                  id={key}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleChange(key, file);
                  }}
                />
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