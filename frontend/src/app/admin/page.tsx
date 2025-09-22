"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { fetchUsers, createUser, deleteUser, updateUser } from "../utils/api";
import { User } from "../types/FixedTypes";
import { gradients, palette, shadows } from "../theme";

type EditableUser = User & { password?: string };
type NewUserFormState = {
  username: string;
  password: string;
};

const initialNewUserState: NewUserFormState = {
  username: "",
  password: "",
};

export default function AdminUsersPage() {
  const { isAuthenticated, isSuperUser } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<NewUserFormState>(initialNewUserState);
  const [editUser, setEditUser] = useState<EditableUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isSuperUser) {
      router.push("/");
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const data = await fetchUsers();
        if (!isCancelled) {
          setUsers(data);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        if (!isCancelled) {
          setError("We could not load the user directory. Please try again.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isSuperUser, router]);

  function handleNewUserChange<K extends keyof NewUserFormState>(
    key: K,
    value: NewUserFormState[K]
  ) {
    setNewUser((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        username: newUser.username.trim(),
        password: newUser.password,
      };

      const created = await createUser(payload);
      setUsers((prev) => [...prev, created]);
      setNewUser(initialNewUserState);
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Creating the user failed. Check the details and try again.");
    }
  }

  function startEditing(user: User) {
    setEditUser({ ...user });
  }

  function handleEditFieldChange<K extends keyof EditableUser>(
    key: K,
    value: EditableUser[K]
  ) {
    setEditUser((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleUpdateUser() {
    if (!editUser) {
      return;
    }

    setError(null);

    const payload: Record<string, string> = {
      username: editUser.username.trim(),
      email: (editUser.email ?? "").trim(),
    };

    if (editUser.password && editUser.password.trim().length > 0) {
      payload.password = editUser.password;
    }

    try {
      const updated = await updateUser(editUser.id, payload);
      setUsers((prev) => prev.map((user) => (user.id === editUser.id ? updated : user)));
      setEditUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Updating the user failed. Please try again.");
    }
  }

  function confirmDeleteUser(user: User) {
    setUserToDelete(user);
  }

  async function handleConfirmDelete() {
    if (!userToDelete) {
      return;
    }

    setError(null);

    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Deleting the user failed. Please try again.");
    } finally {
      setUserToDelete(null);
    }
  }

  const userCountLabel = loading
    ? "Loading..."
    : `${users.length} ${users.length === 1 ? "user" : "users"}`;

  if (!isSuperUser) {
    return null;
  }

  const createDisabled =
    newUser.username.trim().length === 0 || newUser.password.trim().length === 0;

  return (
    <div style={pageWrapperStyle}>
      <section style={headerCardStyle}>
        <div style={cardAccentStyle} />
        <span style={eyebrowStyle}>Administration</span>
        <div style={headerTitleRowStyle}>
          <h1 style={headerTitleStyle}>User Management</h1>
          <span style={countBadgeStyle}>{userCountLabel}</span>
        </div>
        <p style={headerSubtitleStyle}>
          Invite colleagues, update account details, and keep the DTCC workspace secure.
        </p>
      </section>

      {error && <div style={errorBannerStyle}>{error}</div>}

      <div style={contentGridStyle}>
        <section style={formCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Invite a new user</h2>
            <p style={cardSubtitleStyle}>
              Create an account with baseline permissions. You can promote users in the API if needed.
            </p>
          </div>

          <form onSubmit={handleCreateUser} style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={labelTextStyle}>Username</span>
              <input
                type="text"
                value={newUser.username}
                onChange={(event) => handleNewUserChange("username", event.target.value)}
                style={inputStyle}
                required
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelTextStyle}>Password</span>
              <input
                type="password"
                value={newUser.password}
                onChange={(event) => handleNewUserChange("password", event.target.value)}
                style={inputStyle}
                required
              />
            </label>

            <div style={formActionsStyle}>
              <button
                type="button"
                onClick={() => setNewUser(initialNewUserState)}
                style={secondaryButtonStyle}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={createDisabled}
                style={{
                  ...primaryButtonStyle,
                  opacity: createDisabled ? 0.5 : 1,
                  pointerEvents: createDisabled ? "none" : "auto",
                }}
              >
                Create user
              </button>
            </div>
          </form>
        </section>

        <section style={listCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Directory</h2>
            <p style={cardSubtitleStyle}>
              Edit usernames or email addresses directly in-line. Password changes are optional.
            </p>
          </div>

          {loading ? (
            <div style={loadingStateStyle}>Fetching users...</div>
          ) : users.length === 0 ? (
            <div style={emptyStateStyle}>
              <h3 style={emptyStateTitleStyle}>No users yet</h3>
              <p style={emptyStateSubtitleStyle}>
                Once teammates join the programme, they will appear here for quick updates.
              </p>
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeadCellStyle}>ID</th>
                    <th style={tableHeadCellStyle}>Username</th>
                    <th style={tableHeadCellStyle}>Email</th>
                    <th style={tableHeadCellStyle}>Role</th>
                    <th style={tableHeadCellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => {
                    const isEditing = editUser?.id === user.id;
                    const saveDisabled =
                      !isEditing || !editUser?.username || editUser.username.trim().length === 0;

                    return (
                      <tr
                        key={user.id}
                        style={{
                          ...tableRowStyle,
                          backgroundColor:
                            index % 2 === 0 ? "rgba(6, 20, 48, 0.03)" : "transparent",
                        }}
                      >
                        <td style={tableCellStyle}>{user.id}</td>
                        <td style={tableCellStyle}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUser?.username ?? ""}
                              onChange={(event) =>
                                handleEditFieldChange("username", event.target.value)
                              }
                              style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
                              required
                            />
                          ) : (
                            user.username
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editUser?.email ?? ""}
                              onChange={(event) =>
                                handleEditFieldChange("email", event.target.value)
                              }
                              style={{ ...inputStyle, padding: "0.45rem 0.75rem" }}
                            />
                          ) : user.email ? (
                            user.email
                          ) : (
                            <span style={mutedTextStyle}>No email</span>
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          <span
                            style={{
                              ...roleBadgeStyle,
                              backgroundColor: user.is_superuser
                                ? "rgba(88, 211, 195, 0.18)"
                                : "rgba(242, 176, 67, 0.18)",
                              color: user.is_superuser ? palette.teal : palette.gold,
                            }}
                          >
                            {user.is_superuser ? "Superuser" : "Standard"}
                          </span>
                        </td>
                        <td style={{ ...tableCellStyle, minWidth: "200px" }}>
                          <div style={tableActionGroupStyle}>
                            {isEditing && (
                              <input
                                type="password"
                                placeholder="New password (optional)"
                                value={editUser?.password ?? ""}
                                onChange={(event) =>
                                  handleEditFieldChange("password", event.target.value)
                                }
                                style={{ ...inputStyle, padding: "0.4rem 0.75rem", flex: "1 1 160px" }}
                              />
                            )}

                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleUpdateUser}
                                  disabled={saveDisabled}
                                  style={{
                                    ...primaryButtonCompactStyle,
                                    opacity: saveDisabled ? 0.5 : 1,
                                    pointerEvents: saveDisabled ? "none" : "auto",
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditUser(null)}
                                  style={secondaryButtonCompactStyle}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {/* <button
                                  onClick={() => startEditing(user)}
                                  style={ghostButtonStyle}
                                >
                                  Edit
                                </button> */}
                                <button
                                  onClick={() => confirmDeleteUser(user)}
                                  style={dangerButtonStyle}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {userToDelete && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={modalTitleStyle}>Remove user</h3>
            <p style={modalCopyStyle}>
              Delete <strong>{userToDelete.username}</strong>? This action cannot be undone.
            </p>
            <div style={modalActionsStyle}>
              <button onClick={() => setUserToDelete(null)} style={secondaryButtonStyle}>
                Keep user
              </button>
              <button onClick={handleConfirmDelete} style={dangerButtonStyle}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};

const headerCardStyle: React.CSSProperties = {
  position: "relative",
  padding: "2.25rem",
  borderRadius: "28px",
  background: gradients.card,
  boxShadow: shadows.card,
  border: "1px solid rgba(6, 20, 48, 0.08)",
  overflow: "hidden",
};

const cardAccentStyle: React.CSSProperties = {
  position: "absolute",
  top: "18px",
  left: "28px",
  width: "72px",
  height: "6px",
  borderRadius: "999px",
  backgroundImage: gradients.button,
  opacity: 0.85,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(6, 20, 48, 0.55)",
  fontWeight: 600,
};

const headerTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const headerTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  color: palette.textDark,
};

const countBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.35rem 0.9rem",
  borderRadius: "999px",
  backgroundColor: "rgba(6, 20, 48, 0.08)",
  color: "rgba(6, 20, 48, 0.65)",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const headerSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(6, 20, 48, 0.65)",
  maxWidth: "620px",
  lineHeight: 1.5,
};

const errorBannerStyle: React.CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "18px",
  border: "1px solid rgba(180, 60, 60, 0.3)",
  backgroundColor: "rgba(204, 65, 65, 0.12)",
  color: "rgb(148, 32, 32)",
  fontWeight: 600,
  boxShadow: "0 16px 32px rgba(148, 32, 32, 0.14)",
};

const contentGridStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2.5rem",
  alignItems: "stretch",
};

const cardBaseStyle: React.CSSProperties = {
  background: gradients.card,
  borderRadius: "28px",
  boxShadow: shadows.card,
  border: "1px solid rgba(6, 20, 48, 0.08)",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const formCardStyle: React.CSSProperties = {
  ...cardBaseStyle,
  maxWidth: "520px",
  alignSelf: "flex-start",
};

const listCardStyle: React.CSSProperties = {
  ...cardBaseStyle,
  width: "100%",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  color: palette.textDark,
};

const cardSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(6, 20, 48, 0.6)",
  lineHeight: 1.5,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const labelTextStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(6, 20, 48, 0.65)",
};

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 0.9rem",
  borderRadius: "14px",
  border: "1px solid rgba(6, 20, 48, 0.12)",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  fontSize: "0.95rem",
  color: palette.textDark,
  outline: "none",
  boxShadow: "inset 0 1px 3px rgba(8, 16, 36, 0.08)",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  marginTop: "0.5rem",
};

const buttonBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
  padding: "0.55rem 1.4rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  backgroundImage: gradients.button,
  color: palette.textDark,
  boxShadow: "0 16px 30px rgba(242, 176, 67, 0.35)",
};

const primaryButtonCompactStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  padding: "0.45rem 1.2rem",
  boxShadow: "0 12px 24px rgba(242, 176, 67, 0.25)",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: "rgba(6, 20, 48, 0.08)",
  color: "rgba(6, 20, 48, 0.75)",
  boxShadow: "none",
};

const secondaryButtonCompactStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  padding: "0.45rem 1.2rem",
};

const ghostButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  padding: "0.45rem 1.2rem",
  backgroundColor: "rgba(6, 20, 48, 0.05)",
  color: palette.textDark,
  boxShadow: "none",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  padding: "0.45rem 1.2rem",
  backgroundColor: "rgba(179, 40, 40, 0.12)",
  color: "rgb(179, 40, 40)",
  boxShadow: "none",
};

const tableWrapperStyle: React.CSSProperties = {
  borderRadius: "22px",
  border: "1px solid rgba(6, 20, 48, 0.08)",
  overflow: "hidden",
  backgroundColor: "rgba(255, 255, 255, 0.92)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeadCellStyle: React.CSSProperties = {
  textAlign: "left",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(6, 20, 48, 0.55)",
  padding: "0.85rem 1.25rem",
  borderBottom: "1px solid rgba(6, 20, 48, 0.12)",
  backgroundColor: "rgba(6, 20, 48, 0.06)",
};

const tableRowStyle: React.CSSProperties = {
  transition: "background-color 0.2s ease",
};

const tableCellStyle: React.CSSProperties = {
  padding: "0.9rem 1.25rem",
  fontSize: "0.95rem",
  color: palette.textDark,
  borderBottom: "1px solid rgba(6, 20, 48, 0.08)",
};

const mutedTextStyle: React.CSSProperties = {
  color: "rgba(6, 20, 48, 0.45)",
  fontStyle: "italic",
};

const roleBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const tableActionGroupStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  alignItems: "center",
};

const loadingStateStyle: React.CSSProperties = {
  padding: "2.5rem",
  textAlign: "center",
  color: "rgba(6, 20, 48, 0.6)",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "2.5rem",
  borderRadius: "20px",
  border: "1px dashed rgba(6, 20, 48, 0.2)",
  textAlign: "center",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
};

const emptyStateTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.2rem",
  color: palette.textDark,
};

const emptyStateSubtitleStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  marginBottom: 0,
  color: "rgba(6, 20, 48, 0.6)",
  lineHeight: 1.5,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(5, 12, 31, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: gradients.card,
  borderRadius: "24px",
  padding: "2rem",
  boxShadow: shadows.floating,
  border: "1px solid rgba(6, 20, 48, 0.12)",
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.25rem",
  color: palette.textDark,
};

const modalCopyStyle: React.CSSProperties = {
  marginTop: "0.75rem",
  marginBottom: 0,
  color: "rgba(6, 20, 48, 0.65)",
  lineHeight: 1.5,
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  marginTop: "1.75rem",
};

