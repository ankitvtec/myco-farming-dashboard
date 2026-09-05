import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "myco_user";

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function UserPanel() {
  const [user, setUser] = useState(loadUser);
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operator");
  const ref = useRef(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function signIn(e) {
    e.preventDefault();
    const u = { name: name.trim() || "Guest", email: email.trim(), role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    setShowLogin(false);
    setOpen(true);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setOpen(false);
  }

  return (
    <div className="user-panel" ref={ref}>
      {user ? (
        <>
          <button
            type="button"
            className="user-panel__avatar"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={open}
            title={user.name}
          >
            {initials(user.name)}
          </button>
          {open && (
            <div className="user-panel__menu" role="menu">
              <div className="user-panel__head">
                <span className="user-panel__avatar user-panel__avatar--lg">{initials(user.name)}</span>
                <div className="user-panel__id">
                  <strong>{user.name}</strong>
                  {user.email && <span>{user.email}</span>}
                </div>
              </div>
              <div className="user-panel__row">
                <span className="user-panel__label">Role</span>
                <span className="user-panel__value">{user.role}</span>
              </div>
              <div className="user-panel__row">
                <span className="user-panel__label">Plan</span>
                <span className="user-panel__value">Fleet Monitor</span>
              </div>
              <button type="button" className="user-panel__signout" onClick={signOut} role="menuitem">
                Sign out
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className="user-panel__login"
            onClick={() => {
              setShowLogin((v) => !v);
              setOpen(false);
            }}
          >
            Sign in
          </button>
          {showLogin && (
            <form className="user-panel__menu user-panel__login-form" onSubmit={signIn}>
              <div className="user-panel__title">Customer sign in</div>
              <label className="user-panel__field">
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>
              <label className="user-panel__field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </label>
              <label className="user-panel__field">
                <span>Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Operator</option>
                  <option>Engineer</option>
                  <option>Manager</option>
                  <option>Admin</option>
                </select>
              </label>
              <button type="submit" className="user-panel__signout user-panel__signout--primary">
                Sign in
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
