"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation"; 
// If you are still on Next.js 12 (pages router), you'd use 'next/router' instead
import { User } from "../types/FixedTypes";
import { useAuth } from "../hooks/AuthContext";
import {
  fetchUsers,
  createUser,
  deleteUser,
  updateUser,
} from "../utils/api";

export default function AdminUsersPage() {
  const { isAuthenticated, isSuperUser } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for creating a new user
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });

  // State to track which user we're editing (if any)
  // We'll allow partial updates. The user data from Django typically won't expose a password,
  // but we can optionally supply one if we want to reset it.
  const [editUser, setEditUser] = useState<User & { password?: string } | null>(null);

  // On mount, fetch the existing users (only if user is authenticated + superuser)
  useEffect(() => {
    // Otherwise, load user list
    (async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isSuperUser, router]);

  // CREATE a new user
  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await createUser(newUser);
      setUsers((prev) => [...prev, created]);
      // Reset form
      setNewUser({ username: "", email: "", password: "" });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // UPDATE (partial) an existing user
  async function handleUpdateUser() {
    if (!editUser) return;
    const userId = editUser.id;

    // Build partial data from editUser (only the fields we want to send)
    // For instance, if password is empty, we might exclude it
    const { username, email, password } = editUser;
    const payload: Partial<{ username: string; email: string; password: string }> = {
      username,
      email,
    };
    if (password) {
      payload.password = password;
    }

    try {
      const updated = await updateUser(userId, payload);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setEditUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  // DELETE a user
  async function handleDeleteUser(userId: number) {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isSuperUser) {
    // Additional check if needed
    return <p>You are not authorized to view this page.</p>;
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Admin: User Management</h1>

      {/* CREATE NEW USER FORM */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Create a New User</h2>
        <form onSubmit={handleCreateUser}>
          <div>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          <button type="submit">Create User</button>
        </form>
      </section>

      {/* USER LIST */}
      <section>
        <h2>Existing Users</h2>
        {users.length === 0 && <p>No users found.</p>}
        {users.length > 0 && (
          <table border={1} cellPadding={8} cellSpacing={0}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Superuser?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {editUser && editUser.id === u.id ? (
                      <input
                        type="text"
                        value={editUser.username}
                        onChange={(e) =>
                          setEditUser({ ...editUser, username: e.target.value })
                        }
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td>
                    {editUser && editUser.id === u.id ? (
                      <input
                        type="email"
                        value={editUser.email}
                        onChange={(e) =>
                          setEditUser({ ...editUser, email: e.target.value })
                        }
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td>{u.is_superuser ? "Yes" : "No"}</td>
                  <td>
                    {editUser && editUser.id === u.id ? (
                      <>
                        <button onClick={handleUpdateUser}>Save</button>
                        <button onClick={() => setEditUser(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditUser({ ...u })}>Edit</button>
                        <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
