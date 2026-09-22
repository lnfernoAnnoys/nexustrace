import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { UserProfileProvider } from "./context/UserProfileContext.tsx";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import { applyTheme, initialTheme } from "./theme/core";

// applied here, before React mounts, so the picked theme is on screen from the very first paint
applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProfileProvider>
          <ThemeProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </ThemeProvider>
        </UserProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
