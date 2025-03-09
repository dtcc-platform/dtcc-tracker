"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ForgotPassword.module.css"; // If you have a CSS module

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Forgot Password</h2>
        <p className={styles.subtitle}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            className={styles.input}
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Send Reset Email
          </button>
        </form>
        <Link href="/login" className={styles.backLink}>
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
}
