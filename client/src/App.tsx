import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SavedProfilesScreen } from './components/SavedProfilesScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { Button } from './components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { Toaster } from 'sonner';
import './App.css';
import type { RouterProfile } from '../../server/src/schema';

export type Screen = 'login' | 'saved' | 'dashboard';

export interface ActiveConnection {
  profile: RouterProfile;
  routerIdentity: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleConnectionSuccess = (profile: RouterProfile, routerIdentity: string) => {
    setActiveConnection({ profile, routerIdentity });
    setCurrentScreen('dashboard');
  };

  const handleDisconnect = () => {
    setActiveConnection(null);
    setCurrentScreen('login');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen 
            onNavigateToSaved={() => setCurrentScreen('saved')}
            onConnectionSuccess={handleConnectionSuccess}
          />
        );
      case 'saved':
        return (
          <SavedProfilesScreen 
            onNavigateBack={() => setCurrentScreen('login')}
            onConnectionSuccess={handleConnectionSuccess}
          />
        );
      case 'dashboard':
        return activeConnection ? (
          <DashboardScreen 
            activeConnection={activeConnection}
            onDisconnect={handleDisconnect}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header with theme toggle */}
      <header className="fixed top-0 right-0 z-50 p-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          {darkMode ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      </header>

      {/* Main content */}
      <main className="pt-16">
        {renderScreen()}
      </main>

      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        theme={darkMode ? 'dark' : 'light'}
        richColors
      />
    </div>
  );
}

export default App;