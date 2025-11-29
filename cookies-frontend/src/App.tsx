import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import apiUrl from './components/apiUrl';
import LoginForm from './components/loginForm';
import NavBar from './components/navBar';
import { PodsProvider } from './components/PodsProvider';
import Home from './pages/Home';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Items from './pages/Items';
import Pod from './pages/Pod';
import Profile from './pages/Profile';
import PasswordReset from './pages/PasswordReset';

const validateUserSession = async (): Promise<boolean | string> => {
  const response = await fetch(`${apiUrl}/validate`, {
    credentials: 'include',
  });
  const testResult = await response.json();
  return testResult;
};

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | string | null>(null);
  const location = useLocation();

  // Public routes that don't require authentication
  const publicRoutes = ['/register', '/welcome', '/password-reset'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    let mounted = true;
    validateUserSession()
      .then((res) => {
        if (mounted) setLoggedIn(res);
      })
      .catch(() => {
        if (mounted) setLoggedIn(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 font-sans">
        <div>Loading...</div>
      </div>
    );
  }

  if (isPublicRoute && loggedIn !== true) {
    return (
      <div className="antialiased bg-zinc-50 dark:bg-zinc-900">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/password-reset" element={<PasswordReset />} />
        </Routes>
      </div>
    );
  }

  if (loggedIn !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Cookies Gifts
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
            <LoginForm onSuccess={() => setLoggedIn(true)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PodsProvider>
      <div className="flex h-screen overflow-hidden">
        <NavBar
          setLoggedIn={setLoggedIn}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 pb-20 md:pb-6 dark:bg-zinc-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/items" element={<Items />} />
            <Route path="/pod/:id" element={<Pod />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </PodsProvider>
  );
}

export default App;
