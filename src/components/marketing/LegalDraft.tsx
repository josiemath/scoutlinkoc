import { FileWarningIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/misc";
import { formatInZone } from "@/lib/date";

/**
 * Wrapper for legal pages that are still draft templates. The banner stays
 * until the text is reviewed and approved for real operation.
 */
export function LegalDraft({ title, preparedOn, children }: { title: string; preparedOn: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={`Draft template prepared ${formatInZone(preparedOn)}. Not in effect.`} />
      <div className="container-page py-12 md:py-16">
        <Alert variant="warning" className="max-w-3xl">
          <FileWarningIcon aria-hidden="true" />
          <AlertTitle>Draft template, not in effect</AlertTitle>
          <AlertDescription>
            <p>
              This text hasn't been reviewed by a lawyer or approved by any organization. Bracketed items like [Operator
              name] must be completed during review. It describes how ScoutLink OC is designed to behave so reviewers
              have something concrete to start from.
            </p>
          </AlertDescription>
        </Alert>
        <article className="prose-page mt-10">{children}</article>
      </div>
    </>
  );
}
