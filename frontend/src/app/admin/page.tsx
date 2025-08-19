"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUsers,
  createUser,
  deleteUser,
  updateUser,
} from "../utils/api";
import { User } from "../types/FixedTypes";

export default function AdminUsersPage() {
  const { isAuthenticated, isSuperUser } = useAuth();
  const router = useRouter();

  // State: list of users
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State: new user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",  // Example additional field
    lastName: "",   // Example additional field
  });

  // State: editing existing user
  const [editUser, setEditUser] = useState<User & { password?: string } | null>(null);

  // State: confirmation modal for delete
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Load users on mount
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isSuperUser) {
      router.push("/");
      return;
    }

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

  // CREATE user
  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    try {
      // Build the payload that your backend expects
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        // If your Django model has first_name, last_name, you can pass them
        // (Remember to handle them in your serializer, though!)
        first_name: newUser.firstName,
        last_name: newUser.lastName,
      };

      const created = await createUser(payload);
      setUsers((prev) => [...prev, created]);

      // Clear the form
      setNewUser({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }

  // UPDATE user
  async function handleUpdateUser() {
    if (!editUser) return;
    const userId = editUser.id;

    const payload: Record<string, string> = {
      username: editUser.username,
      email: editUser.email,
    };
    if (editUser.password) {
      payload.password = editUser.password;
    }

    try {
      const updated = await updateUser(userId, payload);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setEditUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }

  // Initiate delete (show confirmation modal)
  function confirmDeleteUser(user: User) {
    setUserToDelete(user);
  }

  // Actually delete user (after user confirms)
  async function handleConfirmDelete() {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setUserToDelete(null); // Hide modal
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isSuperUser) {
    return <p>You are not authorized to view this page.</p>;
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Admin: User Management</h1>

      {/* CREATE NEW USER FORM */}
      <section
        style={{
          marginBottom: "2rem",
          border: "1px solid #ccc",
          padding: "1rem",
          borderRadius: "6px",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create a New User</h2>
        <form
  onSubmit={handleCreateUser}
  style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
>
  <div>
    <label htmlFor="username" style={{ display: "block", marginBottom: "0.2rem" }}>
      Username:
    </label>
    <input
      id="username"
      type="text"
      value={newUser.username}
      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
      required
    />
  </div>

  {/* <div>
    <label htmlFor="email" style={{ display: "block", marginBottom: "0.2rem" }}>
      Email (optional):
    </label>
    <input
      id="email"
      type="email"
      value={newUser.email}
      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    />
  </div> */}

  <div>
    <label htmlFor="password" style={{ display: "block", marginBottom: "0.2rem" }}>
      Password:
    </label>
    <input
      id="password"
      type="password"
      value={newUser.password}
      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
      style={{
        width: "100%",
        padding: "0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
      required
    />
  </div>

  <button
    type="submit"
    style={{
      backgroundColor: "#0070f3",
      color: "#fff",
      padding: "0.5rem 1rem",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginTop: "0.5rem",
    }}
  >
    Create User
  </button>
</form>
      </section>

      {/* USER LIST */}
      <section>
        <h2>Existing Users</h2>
        {users.length === 0 && <p>No users found.</p>}
        {users.length > 0 && (
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              maxWidth: "800px",
            }}
          >
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Username</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Superuser?</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #ccc" }}>
                  <td style={tableCellStyle}>{u.id}</td>
                  <td style={tableCellStyle}>
                    {editUser && editUser.id === u.id ? (
                      <input
                        type="text"
                        value={editUser.username}
                        onChange={(e) =>
                          setEditUser({ ...editUser, username: e.target.value })
                        }
                        style={{ padding: "0.3rem" }}
                      />
                    ) : (
                      u.username
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    {editUser && editUser.id === u.id ? (
                      <input
                        type="email"
                        value={editUser.email}
                        onChange={(e) =>
                          setEditUser({ ...editUser, email: e.target.value })
                        }
                        style={{ padding: "0.3rem" }}
                      />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td style={tableCellStyle}>{u.is_superuser ? "Yes" : "No"}</td>
                  <td style={tableCellStyle}>
                    {editUser && editUser.id === u.id ? (
                      <>
                        <button
                          onClick={handleUpdateUser}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: "green",
                            color: "#fff",
                            marginRight: "4px",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditUser(null)}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: "#999",
                            color: "#fff",
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditUser({ ...u })}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: "#0070f3",
                            color: "#fff",
                            marginRight: "4px",
                          }}
                          title="Edit user"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => confirmDeleteUser(u)}
                          style={{
                            ...actionButtonStyle,
                            backgroundColor: "red",
                            color: "#fff",
                          }}
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete user &quot;{userToDelete.username}&quot;?
            </p>
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={handleConfirmDelete}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: "red",
                  color: "#fff",
                  marginRight: "8px",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                style={{ ...actionButtonStyle, backgroundColor: "#999", color: "#fff" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for the table
const tableHeaderStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "2px solid #ccc",
};

const tableCellStyle: React.CSSProperties = {
  padding: "0.5rem",
};

// Inline styles for action buttons
const actionButtonStyle: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.9rem",
};

// Inline styles for the modal overlay & box
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "1.5rem",
  borderRadius: "6px",
  width: "300px",
  maxWidth: "90%",
  textAlign: "center",
};
