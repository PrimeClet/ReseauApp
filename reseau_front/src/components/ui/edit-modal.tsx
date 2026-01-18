import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
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
    type: 'text' | 'select' | 'number' | 'textarea';
    options?: Array<{ value: string; label: string }> | string[];
    disabled?: boolean;
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
      // Commencer avec toutes les données originales (id, batiment_id, etc.)
      const initialData: any = { ...data };
      if (fields) {
        fields.forEach(field => {
          // Pour les champs file, ne pas pré-remplir (on ne peut pas pré-remplir un input file)
          if (field.type === 'file') {
            initialData[field.key] = undefined;
          } else if (field.type === 'select') {
            const value = data[field.key];
            // Si la valeur existe mais ne correspond à aucune option, essayer de trouver une correspondance
            if (value !== undefined && value !== null && field.options) {
              // Vérifier si les options sont des objets avec value/label
              const hasObjectOptions = field.options.some(opt => typeof opt === 'object' && opt !== null && 'value' in opt);

              if (hasObjectOptions) {
                // Convertir la valeur en string pour correspondre aux options
                const stringValue = String(value);
                const matchingOption = field.options.find(opt => {
                  const isObjectOption = typeof opt === 'object' && opt !== null;
                  const optValue = isObjectOption ? opt.value : opt;
                  return String(optValue) === stringValue;
                });
                // Utiliser la valeur string correspondante
                if (matchingOption) {
                  const isObjectOption = typeof matchingOption === 'object' && matchingOption !== null;
                  initialData[field.key] = isObjectOption ? matchingOption.value : String(matchingOption);
                } else {
                  initialData[field.key] = stringValue;
                }
              } else {
                // Options simples (strings)
                const matchingOption = field.options.find(opt => {
                  return String(opt).toLowerCase() === String(value).toLowerCase();
                });
                initialData[field.key] = matchingOption ? String(matchingOption) : String(value);
              }
            } else {
              initialData[field.key] = value !== undefined && value !== null ? String(value) : '';
            }
          } else {
            initialData[field.key] = data[field.key] !== undefined && data[field.key] !== null ? data[field.key] : '';
          }
        });
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
          {formFields.map(({ key, label, type, options, disabled }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium capitalize">
                {label}
              </Label>

              {type === 'select' && options ? (
                <Select
                  value={formData[key] !== undefined && formData[key] !== null && formData[key] !== '' ? String(formData[key]) : undefined}
                  onValueChange={(value) => {
                    // Convertir en nombre si l'option originale était un nombre
                    const firstOption = options[0];
                    const isObjectOption = typeof firstOption === 'object' && firstOption !== null;
                    const originalValue = isObjectOption ? (firstOption as any).value : firstOption;
                    const shouldBeNumber = typeof originalValue === 'number';
                    handleChange(key, shouldBeNumber ? Number(value) : value);
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Sélectionner ${label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => {
                      const isObjectOption = typeof option === 'object' && option !== null;
                      const optionValue = isObjectOption ? (option as any).value : option;
                      const optionLabel = isObjectOption ? (option as any).label : option;
                      return (
                        <SelectItem key={String(optionValue)} value={String(optionValue)}>
                          {optionLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : type === 'textarea' ? (
                <Textarea
                  id={key}
                  value={formData[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={`Entrer ${label}`}
                  rows={3}
                  disabled={disabled}
                />
              ) : (
                <Input
                  id={key}
                  type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'time' ? 'time' : 'text'}
                  value={formData[key] ?? ''}
                  onChange={(e) => handleChange(key, type === 'number' ? (e.target.value === '' ? '' : parseInt(e.target.value, 10)) : e.target.value)}
                  placeholder={`Entrer ${label}`}
                  disabled={disabled}
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