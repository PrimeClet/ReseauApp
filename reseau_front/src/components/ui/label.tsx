import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { getLabelIcon } from "@/lib/label-icons";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  showIcon?: boolean;
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, children, showIcon = false, ...props }, ref) => {
    // Extraire le texte du label pour déterminer l'icône
    const labelText = typeof children === 'string' ? children : '';
    const icon = showIcon ? getLabelIcon(labelText) : null;

    return (
      <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
        {icon ? (
          <span className="flex items-center gap-1.5">
            {icon}
            {children}
          </span>
        ) : (
          children
        )}
      </LabelPrimitive.Root>
    );
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
