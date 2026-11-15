import { useEffect } from "react";
import { focusById } from "@/lib/focus";

/**
 * Moves focus to an element after it renders, whenever `trigger` changes to a
 * truthy value. Used for form errors and confirmations so screen readers
 * announce them. Pass a new object each time to refocus on a repeated message.
 */
export function useFocusOnChange(id: string, trigger: unknown) {
  useEffect(() => {
    if (trigger) focusById(id);
  }, [id, trigger]);
}

/** A form-level message. A fresh object per failure, so the same message refocuses. */
export interface FormError {
  text: string;
}
