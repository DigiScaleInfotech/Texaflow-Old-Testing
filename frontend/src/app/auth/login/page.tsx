"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"admin" | "vendor">("admin");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleUserType = () => {
    setUserType(userType === "admin" ? "vendor" : "admin");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        emailOrUsername: formData.username,
        password: formData.password,
        userType: userType,
      });

      if (response.user.role === "vendor") {
        const hasSubscription = localStorage.getItem("vendorSubscriptionPlan");
        const hasSkipped = localStorage.getItem("vendorSubscriptionSkipped");

        if (hasSubscription || hasSkipped) {
          router.push("/dashboard");
        } else {
          router.push("/vendor/subscription");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 rounded-xl shadow-lg bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600">
      {/* Enhanced Toggle Switch with better animation */}
      <div className="flex justify-center mb-6">
        <div className="relative bg-gray-800 rounded-full border p-1 flex w-64 h-11 items-center">
          {/* Animated background pill */}
          <div
            className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out bg-blue-600 shadow-lg shadow-blue-500/20 ${
              userType === "admin"
                ? "left-1 right-[calc(50%-1px)]"
                : "left-[calc(50%-1px)] right-1"
            }`}
          ></div>

          {/* Toggle buttons */}
          <button
            className={`py-2 px-4 rounded-full text-sm font-medium w-1/2 z-10 transition-all duration-300 ${
              userType === "admin"
                ? "text-white scale-105 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => userType !== "admin" && toggleUserType()}
          >
            Admin
          </button>
          <button
            className={`py-2 px-4 rounded-full text-sm font-medium w-1/2 z-10 transition-all duration-300 ${
              userType === "vendor"
                ? "text-white scale-105 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => userType !== "vendor" && toggleUserType()}
          >
            Vendor
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        {userType === "admin" ? "Admin Login" : "Vendor Login"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-800/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
            required
            placeholder={`Enter your ${userType} username`}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
              required
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <label
              htmlFor="remember"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-200"
            >
              Remember me
            </label>
          </div>

          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded bg-blue-600 border border-blue-500 text-white font-medium transition-all duration-200 ${
            loading
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-blue-700 hover:shadow-lg"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-700 dark:text-gray-300">
          {userType === "admin"
            ? "Don't have an account?"
            : "Don't have a vendor account?"}{" "}
          <Link
            href={
              userType === "admin" ? "/auth/register" : "/auth/vendor/register"
            }
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            {userType === "admin" ? "Sign Up" : "Register as Vendor"}
          </Link>
        </p>
      </div>
    </div>
  );
}
