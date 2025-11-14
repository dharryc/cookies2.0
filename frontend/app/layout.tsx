"use client";
import apiUrl from "@/components/apiUrl";
import LoginForm from "@/components/loginForm";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useEffect, useState } from "react";
import AuthProvider from "@/components/AuthProvider";

const validateUserSession = async (): Promise<boolean | string> => {
  const response = await fetch(`${apiUrl}/validate`, {
    credentials: "include",
  });
  const testResult = await response.json();
  return testResult;
};
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loggedIn, setLoggedIn] = useState<boolean | string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      <html lang="en">
        <title>Cookies Gifts</title>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-900`}
        >
          <AuthProvider loggedIn={loggedIn} setLoggedIn={setLoggedIn}>
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 font-sans">
              <div>Loading...</div>
            </div>
          </AuthProvider>
        </body>
      </html>
    );
  }

  if (loggedIn !== true) {
    return (
      <html lang="en">
        <title>Cookies Gifts</title>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-900`}
        >
          <AuthProvider loggedIn={loggedIn} setLoggedIn={setLoggedIn}>
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-12">
              <div className="w-full max-w-md">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">Cookies Gifts</h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Sign in to continue to your dashboard</p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
                <LoginForm onSuccess={() => setLoggedIn(true)} />
              </div>
            </div>
          </div>
          </AuthProvider>
        </body>
      </html>
    );
  }
  return (
    <html lang="en">
      <title>Cookies Gifts</title>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-900`}
      >
        <AuthProvider loggedIn={loggedIn} setLoggedIn={setLoggedIn}>
          <div className="flex h-screen overflow-hidden">
            {/* Left sidebar / navbar */}
            <aside
              className={`${
                sidebarOpen ? "w-64" : "w-16"
              } flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900`}
            >
              <div className="flex h-full flex-col p-4">
                <div className="mb-6 flex items-center justify-between">
                  {sidebarOpen && (
                    <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                      Cookies Gifts
                    </div>
                  )}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      {sidebarOpen ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      )}
                    </svg>
                  </button>
                </div>

                <nav className="flex-1">
                  {/* navigation items can go here */}
                </nav>

                <div className="mt-auto">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${apiUrl}/logout`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                        });
                        setLoggedIn(false);
                      } catch (err) {
                        console.error(err);
                        setLoggedIn(false);
                      }
                    }}
                    className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    title="Logout"
                  >
                    {sidebarOpen ? "Logout" : "⏻"}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
