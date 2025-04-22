import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void; // Can be async
  isDeleting?: boolean;
  className?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onDelete,
  isDeleting = false,
  className,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-16 z-10 mb-4 flex items-center justify-between rounded-md border bg-card p-3 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClearSelection} aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Add other bulk actions here if needed (e.g., Move, Tag) */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
