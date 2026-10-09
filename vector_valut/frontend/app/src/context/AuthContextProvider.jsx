import { createContext, useContext, useState, useEffect } from "react";
import { loginTenant, getTenant } from "../apis/tenant.api";
import { signInWithGoogle } from "../apis/google-auth.api";
import { toast } from "sonner";

export const AuthContext = createContext(null);

export function AuthContextProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear local session storage
  const clearSession = () => {
    localStorage.removeItem("tenantId");
    localStorage.removeItem("tenantName");
    localStorage.removeItem("tenantEmail");
    setTenant(null);
  };

  // If currently on a tenant vanity subdomain (e.g. acmecorp.mahesh.com) but there's
  // no active session, bounce back to the bare base domain — login/signup should
  // always happen there, not on a specific tenant's subdomain. Returns true if it
  // triggered a redirect (caller should stop further processing).
  const redirectToBaseDomainIfUnauthed = () => {
    const currentHost = window.location.hostname;
    const path = `${window.location.pathname}${window.location.search}`;

    const maheshMatch = currentHost.match(/^([a-z0-9-]+)\.mahesh\.com$/);
    if (maheshMatch) {
      window.location.replace(`http://mahesh.com${path}`);
      return true;
    }

    const localhostMatch = currentHost.match(/^([a-z0-9-]+)\.localhost$/);
    if (localhostMatch) {
      const port = window.location.port ? `:${window.location.port}` : "";
      window.location.replace(`http://localhost${port}${path}`);
      return true;
    }

    return false;
  };

  // Re-verify the current session with backend on app boot.
  // Returns true if it started a full-page redirect to another host, so callers
  // must not navigate afterwards. `targetPath` overrides the path used for the
  // vanity-subdomain redirect (e.g. "/dashboard" right after signing in).
  const checkAuth = async (targetPath) => {
    try {
      const response = await getTenant();
      
      // Unbox the tenant profile object if backend returns success
      if (response && response.success && response.data) {
        const tenantData = response.data;
        localStorage.setItem("tenantId", tenantData.tenantId);
        localStorage.setItem("tenantName", tenantData.name);
        localStorage.setItem("tenantEmail", tenantData.email);

        // Vanity workspace URL (dev only): if this tenant has a subdomain configured
        // and we're not already on it, redirect there. The auth cookie is scoped to
        // the matching parent domain server-side, so the session carries over.
        // - *.mahesh.com goes through the nginx proxy on port 80 (no port in the URL)
        // - *.localhost goes directly through Vite, keeping its current port
        const currentHost = window.location.hostname;
        if (tenantData.subdomain) {
          let expectedHost = null;
          let keepPort = false;
          if (currentHost.endsWith("mahesh.com")) {
            expectedHost = `${tenantData.subdomain}.mahesh.com`;
          } else if (currentHost.endsWith("localhost")) {
            expectedHost = `${tenantData.subdomain}.localhost`;
            keepPort = true;
          }

          if (expectedHost && currentHost !== expectedHost) {
            const port = keepPort && window.location.port ? `:${window.location.port}` : "";
            const path = targetPath ?? `${window.location.pathname}${window.location.search}`;
            window.location.replace(`http://${expectedHost}${port}${path}`);
            return true;
          }
        }

        setTenant(tenantData);
      } else {
        clearSession();
        if (redirectToBaseDomainIfUnauthed()) return true;
      }
    } catch (error) {
      // 401/403 just means no active session yet — expected for anonymous visitors
      if (error.status === 401 || error.status === 403) {
        clearSession();
        if (redirectToBaseDomainIfUnauthed()) return true;
      } else {
        console.error("Authentication session check failed:", error);
      }
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login via email/password credentials
  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await loginTenant(credentials);
      
      if (response.success && response.data) {
        localStorage.setItem("tenantId", response.data.tenantId);
        localStorage.setItem("tenantName", response.data.name);
        localStorage.setItem("tenantEmail", response.data.email);
        setTenant(response.data);
        toast.success("Successfully logged in!");
        return response.data;
      } else {
        throw new Error(response.message || "Invalid email or password");
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = () => {
    clearSession();
    toast.success("Logged out successfully");
  };

  // Redirect to Google OAuth consent page
  const googleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error("Failed to start Google sign-in flow.");
    }
  };

  return (
    <AuthContext.Provider value={{ tenant, isLoading, login, logout, googleLogin, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

