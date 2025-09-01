import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Eye, EyeOff, Wifi, Save, Archive } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import type { RouterProfile, CreateRouterProfileInput, RouterConnectionInput } from '../../../server/src/schema';

interface LoginScreenProps {
  onNavigateToSaved: () => void;
  onConnectionSuccess: (profile: RouterProfile, routerIdentity: string) => void;
}

export function LoginScreen({ onNavigateToSaved, onConnectionSuccess }: LoginScreenProps) {
  const [formData, setFormData] = useState<RouterConnectionInput & { name: string; rememberPassword: boolean }>({
    host: '',
    username: '',
    password: '',
    name: '',
    rememberPassword: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load remembered credentials from localStorage
  useEffect(() => {
    const remembered = localStorage.getItem('remembered-credentials');
    if (remembered) {
      try {
        const parsed = JSON.parse(remembered);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          rememberPassword: true
        }));
      } catch (error) {
        console.error('Failed to load remembered credentials:', error);
      }
    }
  }, []);

  // Save/remove credentials from localStorage based on remember setting
  useEffect(() => {
    if (formData.rememberPassword && formData.host && formData.username && formData.password) {
      const toRemember = {
        host: formData.host,
        username: formData.username,
        password: formData.password,
        name: formData.name
      };
      localStorage.setItem('remembered-credentials', JSON.stringify(toRemember));
    } else if (!formData.rememberPassword) {
      localStorage.removeItem('remembered-credentials');
    }
  }, [formData]);

  const handleConnect = async () => {
    if (!formData.host || !formData.username || !formData.password) {
      toast.error('Semua field harus diisi');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await trpc.testRouterConnection.mutate({
        host: formData.host,
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        toast.success('Koneksi berhasil!');
        // Create a temporary profile for the connection
        const tempProfile: RouterProfile = {
          id: -1, // Temporary ID
          name: formData.name || formData.host,
          host: formData.host,
          username: formData.username,
          password: formData.password,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        onConnectionSuccess(tempProfile, result.router_identity || 'MikroTik Router');
      } else {
        toast.error(result.message || 'Koneksi gagal');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Terjadi kesalahan saat mencoba menghubungkan');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.host || !formData.username || !formData.password) {
      toast.error('Semua field harus diisi untuk menyimpan profil');
      return;
    }

    setIsSaving(true);
    try {
      const profileData: CreateRouterProfileInput = {
        name: formData.name || `Router ${formData.host}`,
        host: formData.host,
        username: formData.username,
        password: formData.password,
        is_active: false
      };

      await trpc.createRouterProfile.mutate(profileData);
      toast.success('Profil berhasil disimpan');
      
      // Reset form
      setFormData({
        host: '',
        username: '',
        password: '',
        name: '',
        rememberPassword: formData.rememberPassword
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <Wifi className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          MikroTik Netwatch
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor status perangkat jaringan
        </p>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Hubungkan ke Router</CardTitle>
          <CardDescription>
            Masukkan kredensial untuk terhubung ke MikroTik router
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Router (Opsional)</Label>
            <Input
              id="name"
              placeholder="Router Kantor"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Alamat IP/Host *</Label>
            <Input
              id="host"
              placeholder="192.168.1.1"
              value={formData.host}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, host: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nama Pengguna *</Label>
            <Input
              id="username"
              placeholder="admin"
              value={formData.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData(prev => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                required
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
              id="remember"
              checked={formData.rememberPassword}
              onCheckedChange={(checked: boolean) =>
                setFormData(prev => ({ ...prev, rememberPassword: checked }))
              }
            />
            <Label htmlFor="remember" className="text-sm">
              Ingat kredensial
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !formData.host || !formData.username || !formData.password}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>

            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting || !formData.host || !formData.username || !formData.password}
              className="w-full"
            >
              <Wifi className="w-4 h-4 mr-2" />
              {isConnecting ? 'Menghubungkan...' : 'Hubungkan'}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onNavigateToSaved}
            className="w-full mt-4"
          >
            <Archive className="w-4 h-4 mr-2" />
            Profil Tersimpan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}