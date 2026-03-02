import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Feed from './pages/Feed';
import BottomNav from './components/BottomNav';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import MyTasks from './pages/MyTasks';
import TaskDetails from './pages/TaskDetails';
import CreateTask from './pages/CreateTask';
import Chat from './pages/Chat';
import FAQ from './pages/FAQ';
import { useAppStore } from './store/useAppStore';
import ToastContainer from './components/ToastContainer';

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

function App() {
  const { user, login } = useAppStore();
  const [init, setInit] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Initialize Telegram WebApp
      const tg = window.Telegram?.WebApp;

      if (tg) {
        tg.expand();
        tg.ready();

        // Setup theme based on Telegram
        document.body.className = tg.colorScheme;
        tg.onEvent('themeChanged', () => {
          document.body.className = tg.colorScheme;
        });

        // Simple pseudo-auth based on Telegram User
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          await login(tgUser);
        } else {
          await login({ id: 'demo123', first_name: 'Test', username: 'testuser' });
        }
      } else {
        // Mock login for browser testing
        await login({ id: 'demo123', first_name: 'Browser User', username: 'browser_test' });
      }
      setInit(true);
    };

    initialize();
  }, [login]);

  if (!init || !user) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spin-anim" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <div style={{ marginTop: '16px', fontWeight: '600', color: 'var(--tg-theme-hint-color)' }}>Загрузка Easy Quest...</div>
      </div>
    );
  }

  // Manifest served from our public folder
  const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <ToastContainer />
      <BrowserRouter>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/task/:id" element={<TaskDetails />} />
              <Route path="/tasks" element={<MyTasks />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create-task" element={<CreateTask />} />
              <Route path="/faq" element={<FAQ />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}

export default App;
