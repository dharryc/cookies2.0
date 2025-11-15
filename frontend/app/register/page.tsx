"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserCreationdto from "@/models/userCreationdto";
import apiUrl from "@/components/apiUrl";

type Errors = {
  username?: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  password?: string;
  passwordValidation?: string;
  email?: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [unhashed_password, setPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  function validate() {
    const e: Errors = {};
    if (!username.trim()) e.username = "Username is required";
    if (!first_name.trim()) e.firstName = "First name is required";
    if (!surname.trim()) e.lastName = "Last name is required";
    if (!birthday.trim()) e.birthdate = "Birthdate is required";
    if (unhashed_password.length < 8)
      e.password = "Password must be 8+ characters";
    if (unhashed_password !== passwordValidation)
      e.passwordValidation = "Passwords do not match";
    return e;
  }

  async function submitHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const newUser = new UserCreationdto(
        username,
        first_name,
        surname,
        birthday || null,
        unhashed_password
      );
      const response = await fetch(`${apiUrl}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }
      
      // Automatically log in the user
      const loginResponse = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username,
          password: unhashed_password,
        }),
      });
      
      if (!loginResponse.ok) {
        // Registration succeeded but login failed - still redirect but show message
        setSuccess("Account created! Please log in.");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        return;
      }
      
      setSuccess("Account created! Redirecting to welcome page...");
      // Redirect to welcome page after short delay with full page reload
      setTimeout(() => {
        window.location.href = "/welcome";
      }, 1500);
    } catch (err) {
      setErrors({ ...e, username: "Failed to register — try again" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-md w-full mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Create your account
            </h1>
          </div>

          <form
            className="mt-6 grid grid-cols-1 gap-4"
            onSubmit={submitHandler}
            noValidate
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-username"
                required
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                  placeholder="First"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                  placeholder="Last"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="birthdate"
                className="block text-sm text-zinc-700 dark:text-zinc-300"
              >
                Birthdate
              </label>
              <input
                id="birthdate"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
              />
              {errors.birthdate && (
                <p className="mt-1 text-xs text-red-600">{errors.birthdate}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={unhashed_password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                  placeholder="••••••••"
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="passwordValidation"
                  className="block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  Confirm
                </label>
                <input
                  id="passwordValidation"
                  type="password"
                  value={passwordValidation}
                  onChange={(e) => setPasswordValidation(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100"
                  placeholder="Confirm"
                  required
                />
                {errors.passwordValidation && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.passwordValidation}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full inline-flex justify-center items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>

            {success && (
              <p className="text-sm text-green-600 mt-2">{success}</p>
            )}

            <div className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Already a member?{" "}
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
