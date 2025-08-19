"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import Image from "next/image";
import newLogo from "../../../public/dtcc-logo-new.png";
import {useRefresh} from "../contexts/RefreshContext";
import { BASE_URL } from "../types/FixedTypes";
const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth(); // Get login function from auth context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Error state
  const {triggerRefresh} =useRefresh()
  useEffect(() => {
    console.log("BASE_URL:", BASE_URL);
  })
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
  
    const success = await login(username, password); // Check if login was successful
  
    if (success) {
      triggerRefresh()
      router.push("/"); // Redirect only on success
    } else {
      setError("Invalid username or password"); // Display error message
    }
  };

  return (
    <div className={styles.container}>
      <div>
        <div className="flex items-center">
          <Image
            src={newLogo}
            alt="DTCC Logo"
            className="object-contain max-w-[100px]"  // increased from 40px to 80px
          />
          {/* Vertical divider with a specific color */}
          <div className="h-10 w-px bg-[#899BAF] mx-4"></div>
          {/* Text in two lines with larger font size */}
          <div className="flex flex-col text-[#899BAF] leading-tight">
            <span className="font-bold text-2xl">Digital Twin</span>
            <span className="font-bold text-2xl">Cities Centre</span>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={styles.form} style={{marginTop: "20px"}}>
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

  );
};

export default LoginPage;
