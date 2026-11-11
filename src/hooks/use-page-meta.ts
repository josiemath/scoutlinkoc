import { useEffect } from "react";
import { SITE_NAME } from "@/lib/site";

/** Sets the document title and meta description for the current page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    }
  }, [title, description]);
}
