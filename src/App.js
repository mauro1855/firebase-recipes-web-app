import { useState } from "react";
import firebaseAuthService from "./firebaseAuthService";
import "./App.css";
import LoginForm from "./components/LoginForm";

function App() {
  const [user, setUser] = useState(null);

  firebaseAuthService.subscribeToAuthChanges(setUser);

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
    </div>
  );
}

export default App;
