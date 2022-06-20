import { useState } from "react";
import firebaseAuthService from "../firebaseAuthService";

export default function LoginForm({ existingUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await firebaseAuthService.loginUser(username, password);
      setUsername("");
      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  }

  function handleLogout() {
    firebaseAuthService.logoutUser();
  }

  async function handleSendResetPasswordEmail() {
    if (!username) {
      alert("Missing username");
      return;
    }

    try {
      await firebaseAuthService.sendPasswordResetEmail(username);
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="login-form-container">
      {existingUser ? (
        <div className="row">
          <h3>Welcome, {existingUser.email}</h3>
          <button
            type="button"
            className="primary-button"
            onClick={handleLogout}
          >
            Lougout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <label className="input-label login-label">
            Username (email):
            <input
              type="email"
              className="input-text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            ></input>
          </label>
          <label className="input-label login-label">
            Password:
            <input
              type="password"
              className="input-text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></input>
          </label>
          <div className="button-box">
            <button className="primary-button">Login</button>
            <button
              className="primary-button"
              type="button"
              onClick={handleSendResetPasswordEmail}
            >
              Reset Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
