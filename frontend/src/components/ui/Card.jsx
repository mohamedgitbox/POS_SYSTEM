import { cn } from "../../lib/utils";

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("p-4 pb-2", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardContent({ className, children }) {
  return <div className={cn("p-4 pt-2", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={cn("p-4 pt-0", className)}>{children}</div>;
}
