import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookmarksService, type Bookmark } from '@/services/BookmarksService';
import { setStateInUrl } from '@/lib/urlState';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (lat: number, lng: number, z: number) => void;
}

export const BookmarksDialog: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    BookmarksService.list().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    refresh();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bookmarks</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No bookmarks yet.</div>
          ) : (
            items.map(b => (
              <div key={b.id} className="flex items-center justify-between rounded border p-2">
                <div className="text-sm">
                  <div className="font-medium">{b.title}</div>
                  <div className="text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => {
                    setStateInUrl({ lat: b.state.lat, lng: b.state.lng, z: b.state.z, svc: b.state.svc, layers: b.state.layers }, false);
                    onNavigate(b.state.lat, b.state.lng, b.state.z);
                    onClose();
                  }}>Go</Button>
                  <Button size="sm" variant="destructive" onClick={async () => { await BookmarksService.remove(b.id); refresh(); }}>Delete</Button>
                </div>
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

export default BookmarksDialog;

