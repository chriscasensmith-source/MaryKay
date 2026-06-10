"use client";

// A form-based action button so it works without JavaScript too;
// the confirm() dialog is a progressive enhancement.
export default function ConfirmButton({
  action,
  confirmMessage,
  className,
  children,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className="contents"
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
