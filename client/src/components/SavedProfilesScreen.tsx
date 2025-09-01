import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Edit, Trash2, Play, Router, Loader2 } from 'lucide-react';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import { EditProfileDialog } from './EditProfileDialog';
import type { RouterProfile } from '../../../server/src/schema';

interface SavedProfilesScreenProps {
  onNavigateBack: () => void;
  onConnectionSuccess: (profile: RouterProfile, routerIdentity: string) => void;
}

export function SavedProfilesScreen({ onNavigateBack, onConnectionSuccess }: SavedProfilesScreenProps) {
  const [profiles, setProfiles] = useState<RouterProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [editingProfile, setEditingProfile] = useState<RouterProfile | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getRouterProfiles.query();
      setProfiles(result);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast.error('Gagal memuat profil tersimpan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleUseProfile = async (profile: RouterProfile) => {
    setConnectingId(profile.id);
    try {
      const result = await trpc.testRouterConnection.mutate({
        host: profile.host,
        username: profile.username,
        password: profile.password
      });

      if (result.success) {
        toast.success(`Terhubung ke ${profile.name}`);
        onConnectionSuccess(profile, result.router_identity || 'MikroTik Router');
      } else {
        toast.error(result.message || 'Koneksi gagal');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Terjadi kesalahan saat mencoba menghubungkan');
    } finally {
      setConnectingId(null);
    }
  };

  const handleDeleteProfile = async (profile: RouterProfile) => {
    if (window.confirm(`Hapus profil "${profile.name}"?`)) {
      try {
        await trpc.deleteRouterProfile.mutate({ id: profile.id });
        toast.success('Profil berhasil dihapus');
        await loadProfiles(); // Refresh the list
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Gagal menghapus profil');
      }
    }
  };

  const handleEditSuccess = async () => {
    setEditingProfile(null);
    await loadProfiles(); // Refresh the list
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
          className="mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Profil Tersimpan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola koneksi router yang tersimpan
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && profiles.length === 0 && (
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Router className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Belum ada profil tersimpan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Simpan kredensial router untuk akses cepat di masa mendatang
            </p>
            <Button onClick={onNavigateBack} variant="outline">
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Profiles list */}
      {!isLoading && profiles.length > 0 && (
        <div className="space-y-4">
          {profiles.map((profile: RouterProfile) => (
            <Card 
              key={profile.id} 
              className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Router className="w-5 h-5 text-blue-600" />
                      {profile.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {profile.host} • {profile.username}
                    </CardDescription>
                  </div>
                  {profile.is_active && (
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Aktif
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Dibuat: {profile.created_at.toLocaleDateString('id-ID')}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      disabled={connectingId === profile.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProfile(profile)}
                      disabled={connectingId === profile.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleUseProfile(profile)}
                      disabled={connectingId !== null}
                      className="min-w-[80px]"
                    >
                      {connectingId === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Gunakan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Profile Dialog */}
      {editingProfile && (
        <EditProfileDialog
          profile={editingProfile}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
}