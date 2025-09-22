"use client";

import { useState, useEffect, CSSProperties } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import Image from "next/image";
import newLogo from "../../../public/dtcc-logo-new.png";
import { useRefresh } from "../contexts/RefreshContext";
import { BASE_URL } from "../types/FixedTypes";

const brandingCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  padding: "1.75rem 2rem",
  backgroundColor: "rgba(10, 20, 46, 0.45)",
  borderRadius: "24px",
  border: "1px solid rgba(255, 255, 255, 0.16)",
  boxShadow: "0 24px 50px rgba(5, 12, 31, 0.4)",
  backdropFilter: "blur(18px)",
  color: "#f7f9ff",
};

const brandingDividerStyle: CSSProperties = {
  height: "44px",
  width: "1px",
  backgroundColor: "rgba(255, 255, 255, 0.28)",
};

const brandingTextStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.05,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  fontSize: "15px",
};

const taglineStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  color: "rgba(247, 249, 255, 0.75)",
  textAlign: "center",
};

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    console.log("BASE_URL:", BASE_URL);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await login(username, password);

    if (success) {
      triggerRefresh();
      router.push("/");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <div style={brandingCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Image
              src={newLogo}
              alt="DTCC Logo"
              style={{ width: "64px", height: "64px", objectFit: "contain" }}
              priority
            />
            <div style={brandingDividerStyle} />
            <div style={brandingTextStyle}>
              <span>Digital Twin</span>
              <span>Cities Centre</span>
            </div>
          </div>
          <p style={taglineStyle}>A smarter city starts with a digital twin.</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Log in
          </button>
        </form>
        <div className={styles.forgotPasswordLink}>
          <a href="/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
