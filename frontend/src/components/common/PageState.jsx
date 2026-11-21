import React from 'react';
import { RotateCcw, Inbox } from 'lucide-react';

/**
 * Standard Clinical Ledger PageState: Loading Skeleton, Empty State, Error with Retry
 */
export const PageLoading = ({ message = 'Accessing clinical records...' }) => (
  <div className="py-12 px-4 space-y-4 max-w-4xl mx-auto">
    <div className="flex items-center gap-3 text-xs text-muted font-mono">
      <span className="w-2 h-2 rounded-full bg-blood animate-pulse" />
      <span>{message}</span>
    </div>
    <div className="space-y-2.5">
      <div className="h-6 bg-surface border border-rule rounded-[2px] animate-pulse w-1/3" />
      <div className="h-20 bg-surface border border-rule rounded-[2px] animate-pulse" />
      <div className="h-40 bg-surface border border-rule rounded-[2px] animate-pulse" />
    </div>
  </div>
);

export const PageEmpty = ({
  title = 'No records located',
  description = 'No matching entries were found in the database for the active query parameters.',
  actionLabel,
  onAction,
}) => (
  <div className="py-12 px-6 text-center border border-dashed border-rule bg-surface rounded-[2px] my-4">
    <div className="w-8 h-8 rounded-full border border-rule bg-paper flex items-center justify-center mx-auto mb-3 text-muted">
      <Inbox className="w-4 h-4" />
    </div>
    <h3 className="font-serif text-base text-ink font-semibold">{title}</h3>
    <p className="text-xs text-muted max-w-md mx-auto mt-1 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-4">
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blood text-paper text-xs font-medium rounded-[2px] hover:bg-blood-hover transition-colors"
        >
          <span>{actionLabel}</span>
        </button>
      </div>
    )}
  </div>
);

export const PageError = ({
  message = 'Failed to retrieve database records.',
  onRetry,
}) => (
  <div className="py-8 px-6 border border-rule bg-surface rounded-[2px] my-4 text-center">
    <p className="font-mono text-xs uppercase tracking-wider text-blood mb-1">Database Request Stalled</p>
    <p className="text-xs text-muted max-w-md mx-auto">{message}</p>
    {onRetry && (
      <div className="mt-4">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-ink text-ink text-xs font-medium rounded-[2px] hover:bg-black/5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      </div>
    )}
  </div>
);

export const PageState = ({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  loadingMessage,
  children,
}) => {
  if (loading) return <PageLoading message={loadingMessage} />;
  if (error) return <PageError message={typeof error === 'string' ? error : error?.message} onRetry={onRetry} />;
  if (empty) {
    return (
      <PageEmpty
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }
  return children;
};

export default PageState;
