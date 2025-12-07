import { ReactNode, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  icon?: ReactNode;
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  icon,
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Handle focus when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Set a short timeout to ensure DOM is updated before focusing
      const timer = setTimeout(() => {
        // Focus on cancel button by default for better UX
        cancelRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle confirmation with proper focus management
  const handleConfirm = () => {
    // First close the dialog to ensure clean DOM state
    onOpenChange(false);
    // Then execute onConfirm with a slight delay to ensure cleanup
    setTimeout(() => {
      onConfirm();
    }, 10);
  };

  // Close any open dropdowns when dialog opens and clean up when it closes
  // to prevent aria-hidden focus trap
  useEffect(() => {
    if (open) {
      // When dialog opens, clean up any dropdown wrappers
      const timer = setTimeout(() => {
        const hiddenWrappers = document.querySelectorAll('[data-radix-popper-content-wrapper][data-aria-hidden="true"]');
        hiddenWrappers.forEach((wrapper) => {
          const dropdownContent = wrapper.querySelector('[data-radix-dropdown-menu-content]');
          if (dropdownContent && dropdownContent.getAttribute('data-state') !== 'open') {
            const element = wrapper as HTMLElement;
            element.removeAttribute('aria-hidden');
            element.removeAttribute('data-aria-hidden');
          }
        });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // When dialog closes, ensure all wrappers are cleaned up
      setTimeout(() => {
        const allWrappers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        allWrappers.forEach((wrapper) => {
          const element = wrapper as HTMLElement;
          const content = element.querySelector('[data-state]');
          if (!content || content.getAttribute('data-state') !== 'open') {
            element.removeAttribute('aria-hidden');
            element.removeAttribute('data-aria-hidden');
            element.style.pointerEvents = '';
          }
        });
      }, 150);
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            ref={confirmRef}
            onClick={handleConfirm}
            className={
              variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmDialog };
