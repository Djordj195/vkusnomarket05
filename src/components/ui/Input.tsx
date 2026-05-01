import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
          {label}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          "block w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400",
          "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {(error || hint) && (
        <span
          className={cn(
            "mt-1.5 block text-[12px]",
            error ? "text-red-600" : "text-ink-500"
          )}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, error, hint, ...props }, ref) {
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-[13px] font-medium text-ink-700">
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          className={cn(
            "block w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition placeholder:text-ink-400",
            "border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
            error && "border-red-400 focus:border-red-500 focus:ring-red-100",
            className
          )}
          rows={3}
          {...props}
        />
        {(error || hint) && (
          <span
            className={cn(
              "mt-1.5 block text-[12px]",
              error ? "text-red-600" : "text-ink-500"
            )}
          >
            {error || hint}
          </span>
        )}
      </label>
    );
  }
);
