import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Save, ChevronRight, Loader2 } from "lucide-react";

interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'textarea' | 'radio' | 'file';
  options?: Array<{ value: string; label: string }> | string[];
  disabled?: boolean;
  required?: boolean;
  visibleWhen?: { field: string; value: string | string[] };
  accept?: string; // For file inputs, e.g., "image/*"
  currentImageKey?: string; // Key to get current image URL from data
  icon?: ReactNode; // Icon to display next to the label
  group?: string; // Group name for organizing fields into sections
  placeholder?: string; // Custom placeholder text
  description?: string; // Helper text below the field
  fullWidth?: boolean; // Make field span full width
}

interface FieldGroup {
  name: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  data: any;
  onSave: (updatedData: any) => void | Promise<void>;
  fields?: FieldDefinition[];
  fieldGroups?: FieldGroup[];
  className?: string;
  icon?: ReactNode;
}

export default function EditModal({
  open,
  onOpenChange,
  title,
  subtitle,
  data,
  onSave,
  fields,
  fieldGroups,
  className,
  icon
}: EditModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSave = async () => {
    const payload = data && data.id !== undefined
      ? { id: data.id, ...formData }
      : formData;
    setIsSubmitting(true);
    try {
      await onSave(payload);
      onOpenChange(false);
    } catch {
      // L'erreur est gérée par le parent (toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // Group fields by their group property
  const groupedFields = () => {
    if (!fieldGroups || fieldGroups.length === 0) {
      return { ungrouped: formFields };
    }

    const groups: Record<string, typeof formFields> = {};
    const ungrouped: typeof formFields = [];

    formFields.forEach(field => {
      if (field.group && fieldGroups.find(g => g.name === field.group)) {
        if (!groups[field.group]) {
          groups[field.group] = [];
        }
        groups[field.group].push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { ...groups, ungrouped };
  };

  const renderField = (field: typeof formFields[0]) => {
    const { key, label, type, options, disabled, required, visibleWhen, accept, currentImageKey, icon: fieldIcon, placeholder, description, fullWidth } = field;

    // Vérifier la condition de visibilité
    if (visibleWhen) {
      const currentValue = String(formData[visibleWhen.field] || '');
      const expectedValues = Array.isArray(visibleWhen.value) ? visibleWhen.value : [visibleWhen.value];
      if (!expectedValues.includes(currentValue)) {
        return null;
      }
    }

    return (
      <div key={key} className={`space-y-1.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
        <Label htmlFor={key} className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {fieldIcon && <span className="text-muted-foreground/70">{fieldIcon}</span>}
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        {type === 'radio' && options ? (
          <div className="bg-muted/30 rounded-lg border border-border p-3">
            <RadioGroup
              value={formData[key] !== undefined && formData[key] !== null ? String(formData[key]) : 'false'}
              onValueChange={(value) => handleChange(key, value)}
              className="flex flex-wrap gap-4"
              disabled={disabled}
            >
              {options.map((option) => {
                const isObjectOption = typeof option === 'object' && option !== null;
                const optionValue = isObjectOption ? (option as any).value : option;
                const optionLabel = isObjectOption ? (option as any).label : option;
                const isSelected = String(formData[key]) === String(optionValue);
                return (
                  <div
                    key={String(optionValue)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={String(optionValue)} id={`${key}-${optionValue}`} />
                    <Label htmlFor={`${key}-${optionValue}`} className="font-normal cursor-pointer">
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ) : type === 'select' && options ? (
          <Select
            value={formData[key] !== undefined && formData[key] !== null && formData[key] !== '' ? String(formData[key]) : undefined}
            onValueChange={(value) => {
              const firstOption = options[0];
              const isObjectOption = typeof firstOption === 'object' && firstOption !== null;
              const originalValue = isObjectOption ? (firstOption as any).value : firstOption;
              const shouldBeNumber = typeof originalValue === 'number';
              handleChange(key, shouldBeNumber ? Number(value) : value);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="bg-background border-border hover:border-primary/50 focus:border-primary transition-colors">
              <SelectValue placeholder={placeholder || `Sélectionner ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options
                .filter((option) => {
                  const isObjectOption = typeof option === 'object' && option !== null;
                  const optionValue = isObjectOption ? (option as any).value : option;
                  return optionValue !== '' && optionValue !== null && optionValue !== undefined;
                })
                .map((option) => {
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
        ) : type === 'file' ? (
          <div className="space-y-3">
            {currentImageKey && data[currentImageKey] && (
              <div className="bg-muted/30 rounded-lg border border-border p-3">
                <img
                  src={data[currentImageKey]}
                  alt="Image actuelle"
                  className="max-h-32 rounded-md border border-border object-contain mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">Image actuelle</p>
              </div>
            )}
            <Input
              id={key}
              type="file"
              accept={accept || "image/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleChange(key, file);
              }}
              disabled={disabled}
              className="bg-background border-border file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-primary/90 cursor-pointer"
            />
          </div>
        ) : type === 'textarea' ? (
          <Textarea
            id={key}
            value={formData[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder || `Entrer ${label.toLowerCase()}`}
            rows={3}
            disabled={disabled}
            className="bg-background border-border hover:border-primary/50 focus:border-primary transition-colors resize-none"
          />
        ) : (
          <Input
            id={key}
            type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'time' ? 'time' : 'text'}
            value={formData[key] ?? ''}
            onChange={(e) => handleChange(key, type === 'number' ? (e.target.value === '' ? '' : parseInt(e.target.value, 10)) : e.target.value)}
            placeholder={placeholder || `Entrer ${label.toLowerCase()}`}
            disabled={disabled}
            className="bg-background border-border hover:border-primary/50 focus:border-primary transition-colors"
          />
        )}

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  };

  const groups = groupedFields();

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isSubmitting) onOpenChange(value); }}>
      <DialogContent className={className || "max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"}>
        {/* Header simplifié */}
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-muted-foreground hidden sm:block">{icon}</span>
            )}
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">{title}</DialogTitle>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          )}
        </DialogHeader>

        {/* Contenu avec groupes */}
        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {fieldGroups && fieldGroups.length > 0 ? (
            <>
              {/* Render grouped fields */}
              {fieldGroups.map((group) => {
                const groupFields = groups[group.name];
                if (!groupFields || groupFields.length === 0) return null;

                return (
                  <div key={group.name} className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-1.5">
                      {group.icon && (
                        <span className="text-muted-foreground">{group.icon}</span>
                      )}
                      <h3 className="text-sm font-medium text-foreground">{group.label}</h3>
                      {group.description && (
                        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">— {group.description}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {groupFields.map(renderField)}
                    </div>
                  </div>
                );
              })}

              {/* Render ungrouped fields */}
              {groups.ungrouped && groups.ungrouped.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  {fieldGroups.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground">Autres informations</h3>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {groups.ungrouped.map(renderField)}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Render all fields without grouping */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {formFields.map(renderField)}
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4 mt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-1.5 w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? "Enregistrement..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}