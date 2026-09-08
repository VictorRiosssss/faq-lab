import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("text-[0.8125rem] font-medium text-foreground", className)}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
