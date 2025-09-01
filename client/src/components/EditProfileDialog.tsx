import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import type { RouterProfile, UpdateRouterProfileInput } from '../../../server/src/schema';

interface EditProfileDialogProps {
  profile: RouterProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditProfileDialog({ profile, onSuccess, onCancel }: EditProfileDialogProps) {
  const [formData, setFormData] = useState<Omit<UpdateRouterProfileInput, 'id'>>({
    name: profile.name,
    host: profile.host,
    username: profile.username,
    password: profile.password,
    is_active: profile.is_active
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.host || !formData.username || !formData.password) {
      toast.error('Semua field harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      await trpc.updateRouterProfile.mutate({
        id: profile.id,
        ...formData
      });
      toast.success('Profil berhasil diperbarui');
      onSuccess();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profil Router</DialogTitle>
          <DialogDescription>
            Perbarui informasi koneksi router
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Router</Label>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Router Kantor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-host">Alamat IP/Host</Label>
            <Input
              id="edit-host"
              value={formData.host || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, host: e.target.value }))
              }
              placeholder="192.168.1.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-username">Nama Pengguna</Label>
            <Input
              id="edit-username"
              value={formData.username || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, username: e.target.value }))
              }
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Kata Sandi</Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder="Masukkan kata sandi"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="edit-active"
              checked={formData.is_active || false}
              onCheckedChange={(checked: boolean) =>
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
            <Label htmlFor="edit-active" className="text-sm">
              Tandai sebagai aktif
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.name || !formData.host || !formData.username || !formData.password}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}