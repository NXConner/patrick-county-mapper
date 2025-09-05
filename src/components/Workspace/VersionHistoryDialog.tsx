import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WorkspaceVersionsService, type WorkspaceVersion } from '@/services/WorkspaceVersionsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  onRestore: (version: WorkspaceVersion) => void;
}

export const VersionHistoryDialog: React.FC<Props> = ({ isOpen, onClose, workspaceName, onRestore }) => {
  const [versions, setVersions] = useState<WorkspaceVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    WorkspaceVersionsService.list(workspaceName)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [isOpen, workspaceName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No versions yet.</div>
          ) : (
            versions.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded border p-2">
                <div className="text-sm">
                  <div className="font-medium">Version {v.version}</div>
                  <div className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                <Button size="sm" onClick={() => onRestore(v)}>Restore</Button>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryDialog;

