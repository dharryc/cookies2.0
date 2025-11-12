"use client";
import { useEffect, useState } from "react";

const testFunction = async (): Promise<boolean | string> => {
  const response = await fetch("http://127.0.0.1:8000/validate", { credentials: "include" });
  const testResult = await response.json();
  return testResult;
};

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | string | null>(null);

  useEffect(() => {
    let mounted = true;
    testFunction()
      .then((res) => { if (mounted) setLoggedIn(res); })
      .catch(() => { if (mounted) setLoggedIn(false); });
    return () => { mounted = false; };
  }, []);

  if (loggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div>Loading...</div>
      </div>
    );
  }

  if(loggedIn){
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        {loggedIn ? <div>Logged In</div> : <div>Not Logged In</div>}
      </div>
    );
  }

  return (
    <div>
      {/* // <LoginForm/> */}
    </div>
  );
}