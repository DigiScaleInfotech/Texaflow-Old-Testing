"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate password reset process
    setTimeout(() => {
      // In a real app, you would send a request to your backend here
      console.log("Password reset requested for:", email);
      setIsSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="glass-card p-8 rounded-xl shadow-lg bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Forgot Password
      </h2>

      {isSubmitted ? (
        <div className="text-center">
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-800/50 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded">
            Password reset instructions have been sent to your email address.
          </div>
          <Link
            href="/auth/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            Return to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Enter the email address associated with your account, and we'll send
            you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                required
                placeholder="Enter your email address"
              />
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
                  Sending...
                </span>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
