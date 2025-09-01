import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { 
  LogOut, 
  Search, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity,
  Clock,
  Router,
  Monitor
} from 'lucide-react';
import { trpc } from '../utils/trpc';
import { toast } from 'sonner';
import type { ActiveConnection } from '../App';
import type { NetwatchDevice, NetwatchSummary, NetwatchFilterInput } from '../../../server/src/schema';

interface DashboardScreenProps {
  activeConnection: ActiveConnection;
  onDisconnect: () => void;
}

export function DashboardScreen({ activeConnection, onDisconnect }: DashboardScreenProps) {
  const [devices, setDevices] = useState<NetwatchDevice[]>([]);
  const [summary, setSummary] = useState<NetwatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load data from server
  const loadData = useCallback(async () => {
    if (activeConnection.profile.id === -1) {
      // For temporary connections (not saved), we can't fetch real data
      // Using demo data for demonstration
      const demoDevices: NetwatchDevice[] = [
        {
          id: 1,
          router_profile_id: 1,
          mikrotik_id: "*1",
          host: "8.8.8.8",
          comment: "Google DNS",
          status: Math.random() > 0.3 ? "up" : "down",
          since: new Date(Date.now() - Math.random() * 3600000),
          timeout: "5s",
          interval: "00:01:00",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          router_profile_id: 1,
          mikrotik_id: "*2",
          host: "192.168.1.100",
          comment: "Server Internal",
          status: Math.random() > 0.4 ? "up" : "down",
          since: new Date(Date.now() - Math.random() * 7200000),
          timeout: "3s",
          interval: "00:01:00",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          router_profile_id: 1,
          mikrotik_id: "*3",
          host: "192.168.1.50",
          comment: "Printer HP LaserJet",
          status: Math.random() > 0.2 ? "up" : "down",
          since: new Date(Date.now() - Math.random() * 1800000),
          timeout: "5s",
          interval: "00:02:00",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          router_profile_id: 1,
          mikrotik_id: "*4",
          host: "192.168.1.25",
          comment: "Access Point Utama",
          status: Math.random() > 0.1 ? "up" : "down",
          since: new Date(Date.now() - Math.random() * 900000),
          timeout: "4s",
          interval: "00:01:30",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          router_profile_id: 1,
          mikrotik_id: "*5",
          host: "192.168.1.200",
          comment: "NAS Synology",
          status: Math.random() > 0.25 ? "up" : "down",
          since: new Date(Date.now() - Math.random() * 5400000),
          timeout: "6s",
          interval: "00:03:00",
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Apply filters
      let filteredDevices = demoDevices;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredDevices = filteredDevices.filter(device =>
          device.host.toLowerCase().includes(searchLower) ||
          (device.comment && device.comment.toLowerCase().includes(searchLower))
        );
      }
      if (statusFilter !== 'all') {
        filteredDevices = filteredDevices.filter(device => device.status === statusFilter);
      }

      setDevices(filteredDevices);

      // Calculate summary
      const upCount = demoDevices.filter(d => d.status === 'up').length;
      const downCount = demoDevices.filter(d => d.status === 'down').length;
      setSummary({
        total_devices: demoDevices.length,
        up_devices: upCount,
        down_devices: downCount,
        last_updated: new Date()
      });
      setLastUpdate(new Date());
      return;
    }

    setIsLoading(true);
    try {
      const filter: NetwatchFilterInput = {
        router_profile_id: activeConnection.profile.id,
        search: searchTerm || undefined,
        status: statusFilter
      };

      const [devicesData, summaryData] = await Promise.all([
        trpc.getNetwatchDevices.query(filter),
        trpc.getNetwatchSummary.query({ routerProfileId: activeConnection.profile.id })
      ]);

      setDevices(devicesData);
      setSummary(summaryData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load netwatch data:', error);
      toast.error('Gagal memuat data netwatch');
    } finally {
      setIsLoading(false);
    }
  }, [activeConnection.profile.id, searchTerm, statusFilter]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDisconnect = () => {
    if (window.confirm('Yakin ingin memutuskan koneksi?')) {
      onDisconnect();
    }
  };

  const formatTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}h ${hours % 24}j`;
    if (hours > 0) return `${hours}j ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Monitor className="w-7 h-7 text-blue-600" />
            Netwatch Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Terhubung ke: <span className="font-medium">{activeConnection.profile.name}</span>
            {" "}({activeConnection.profile.host})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Putus Koneksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Perangkat</p>
                  <p className="text-3xl font-bold">{summary.total_devices}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Online</p>
                  <p className="text-3xl font-bold">{summary.up_devices}</p>
                </div>
                <Wifi className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Offline</p>
                  <p className="text-3xl font-bold">{summary.down_devices}</p>
                </div>
                <WifiOff className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan nama atau IP..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'up' | 'down') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="up">Online Saja</SelectItem>
                <SelectItem value="down">Offline Saja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {devices.length} perangkat
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      {devices.length === 0 ? (
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <Router className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Tidak ada perangkat ditemukan
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Coba ubah filter pencarian'
                : 'Belum ada perangkat netwatch yang dikonfigurasi'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devices.map((device: NetwatchDevice) => (
            <Card 
              key={device.id} 
              className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        device.status === 'up' 
                          ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                          : 'bg-red-500 shadow-lg shadow-red-500/30'
                      }`} />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {device.comment || 'Tanpa Nama'}
                      </h3>
                      <Badge 
                        variant={device.status === 'up' ? 'default' : 'destructive'}
                        className={device.status === 'up' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }
                      >
                        {device.status === 'up' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">IP:</span>
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                          {device.host}
                        </code>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Sejak:</span>
                        {formatTimeSince(device.since)} yang lalu
                      </p>
                      {device.timeout && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Timeout:</span>
                          {device.timeout}
                        </p>
                      )}
                      {device.interval && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Interval:</span>
                          {device.interval}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-500 dark:text-gray-500">
                    <p>ID: {device.mikrotik_id}</p>
                    <p>Diperbarui: {device.updated_at.toLocaleTimeString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}