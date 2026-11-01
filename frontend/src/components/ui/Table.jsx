import { cn } from "../../lib/utils";

export default function Table({ className, children }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children }) {
  return <thead className={cn("[&_tr]:border-b", className)}>{children}</thead>;
}

export function TableBody({ className, children }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>;
}

export function TableFooter({ className, children }) {
  return (
    <tfoot
      className={cn(
        "border-t bg-slate-100/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
    >
      {children}
    </tfoot>
  );
}

export function TableRow({ className, children }) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-right align-middle font-medium text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children }) {
  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:px-0",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableCaption({ className, children }) {
  return <caption className={cn("mt-4 text-sm text-slate-500", className)}>{children}</caption>;
}
