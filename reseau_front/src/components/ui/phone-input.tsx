import * as React from "react";
import PhoneInputWithCountry from "react-phone-number-input";
import type { Props as PhoneInputProps } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

export interface PhoneInputComponentProps extends Omit<PhoneInputProps<React.InputHTMLAttributes<HTMLInputElement>>, 'onChange'> {
  onChange?: (value: string | undefined) => void;
  value?: string;
  className?: string;
  placeholder?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputComponentProps>(
  ({ className, onChange, value, placeholder = "Numéro de téléphone", ...props }, ref) => {
    return (
      <PhoneInputWithCountry
        international
        defaultCountry="FR"
        countryCallingCodeEditable={false}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:text-foreground [&_.PhoneInputInput]:placeholder:text-muted-foreground",
          "[&_.PhoneInputCountry]:mr-2",
          "[&_.PhoneInputCountrySelect]:bg-background [&_.PhoneInputCountrySelect]:text-foreground",
          "[&_.PhoneInputCountrySelectArrow]:border-foreground",
          className
        )}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
