"use client";

import { useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";
import Image from "next/image";
import logo from "../../../public/dtcc-logo.png";
import {useRefresh} from "../hooks/RefreshContext";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth(); // Get login function from auth context
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Error state
  const {triggerRefresh} =useRefresh()
  
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
        <Image src={logo} alt="DTCC Logo" width={500} />
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
        {error && <p className={styles.error}>{error}</p>} {/* Show error message if login fails */}
        <button type="submit" className={styles.button}>
          Log in
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
