import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkspaceMembersService, type WorkspaceMember, type WorkspaceRole } from '@/services/WorkspaceMembersService';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
}

export const ShareDialog: React.FC<Props> = ({ isOpen, onClose, workspaceName }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('viewer');

  const refresh = () => {
    WorkspaceMembersService.list(workspaceName).then(setMembers);
  };

  useEffect(() => { if (isOpen) refresh(); }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input placeholder="User ID or Email" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <select className="border rounded px-2 py-1" value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="owner">Owner</option>
            </select>
            <Button onClick={async () => {
              let uid = userId;
              if (userId.includes('@')) {
                const { data } = await supabase.from('profiles').select('id').ilike('email', userId).limit(1);
                if (data && data.length > 0) uid = data[0].id as any;
              }
              await WorkspaceMembersService.add(workspaceName, uid, role);
              setUserId('');
              refresh();
            }}>Add</Button>
          </div>
          <div className="space-y-2 max-h-[40vh] overflow-auto">
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No members yet.</div>
            ) : members.map(m => (
              <div key={m.id} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">{m.user_id}</div>
                  <div className="text-muted-foreground">{m.role}</div>
                </div>
                <Button variant="destructive" size="sm" onClick={async () => { await WorkspaceMembersService.remove(m.id); refresh(); }}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;

