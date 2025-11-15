"use client";
import apiUrl from "@/components/apiUrl";
import LoginForm from "@/components/loginForm";
import NavBar from "@/components/navBar";
import { PodsProvider } from "@/components/PodsProvider";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ["/register", "/welcome"];
  const isPublicRoute = publicRoutes.includes(pathname);

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
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 font-sans">
              <div>Loading...</div>
            </div>
        </body>
      </html>
    );
  }

  if( isPublicRoute && loggedIn !== true ) {
    return (
      <html lang="en">
        <title>Cookies Gifts - Register</title>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-900`}
        >
            {children}
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
        <PodsProvider>
          <div className="flex h-screen overflow-hidden">
            <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setLoggedIn={setLoggedIn} />

            <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 pb-20 md:pb-6 dark:bg-zinc-900">
              {children}
            </main>
          </div>
        </PodsProvider>
      </body>
    </html>
  );
}
