import { cn } from "@/lib/utils";

export function Container({
  className,
  narrow,
  ...props
}: React.ComponentProps<"div"> & { narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        narrow ? "max-w-[760px]" : "max-w-[1140px]",
        className,
      )}
      {...props}
    />
  );
}
