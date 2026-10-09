import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginTenant, registerTenant } from "../apis/tenant.api";
import { signInWithGoogle } from "../apis/google-auth.api";
import { useAuth } from "../Hooks/useAuthHook";
import { toast } from "sonner";

export default function Login() {
  const location = useLocation();
  const isSignUp = location.pathname === "/signup";
  const { tenant, isLoading: authLoading, checkAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Already signed in (e.g. just landed on a tenant subdomain): skip the form.
  useEffect(() => {
    if (!authLoading && tenant) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, tenant, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error("Failed to start Google Sign In. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (!name || !email || !password) {
        toast.error("Please fill in all registration fields.");
        return;
      }
      if (name.length < 3) {
        toast.error("Name must be at least 3 characters long.");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }

      setIsLoading(true);
      try {
        const regResponse = await registerTenant({ name, email, password });
        if (regResponse.success) {
          toast.success("Account registered successfully!");
          
          // Auto-login after registration
          const loginResponse = await loginTenant({ email, password });
          if (loginResponse.success) {
            toast.success("Successfully logged in!");
            // Re-syncs tenant context from the now-authenticated cookie, and
            // redirects to the tenant's vanity subdomain if one is configured.
            const redirected = await checkAuth("/dashboard");
            if (!redirected) navigate("/dashboard");
          } else {
            navigate("/signin");
          }
        } else {
          toast.error(regResponse.message || "Registration failed. Please try again.");
        }
      } catch (err) {
        console.error("Registration request failed:", err);
        toast.error(err.response?.data?.message || err.message || "Registration failed.");
      } finally {
        setIsLoading(false);
      }

    } else {
      if (!email || !password) {
        toast.error("Please fill in all credentials.");
        return;
      }

      setIsLoading(true);
      try {
        const response = await loginTenant({ email, password });

        if (response.success) {
          toast.success("Successfully logged in!");
          // Re-syncs tenant context from the now-authenticated cookie, and
          // redirects to the tenant's vanity subdomain if one is configured.
          const redirected = await checkAuth("/dashboard");
          if (!redirected) navigate("/dashboard");
        } else {
          toast.error(response.message || "Invalid credentials. Please try again.");
        }
      } catch (err) {
        console.error("Login request failed:", err);
        toast.error(err.response?.data?.message || err.message || "Server connection failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#051424] text-[#d4e4fa] font-['Inter']">
      
      {/* Left Panel (Brand Panel) - Desktop Only */}
      <section className="hidden md:flex md:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0D1C2D] to-[#051424] p-12 flex-col justify-between border-r border-white/5">
        
        {/* Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        {/* Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#6C5CE7]/15 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#4bddb7]/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: "-4s" }}></div>

        {/* Brand Content */}
        <div className="relative z-10 space-y-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-[#6c5ce7] rounded-lg flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
              <span className="material-symbols-outlined text-white text-xl">shield</span>
            </div>
            <span className="font-['Hanken_Grotesk'] text-2xl font-bold tracking-tight text-white">
              Vector <span className="text-[#6c5ce7]">Vault</span>
            </span>
          </Link>

          {/* Headline */}
          <div className="space-y-4">
            <p className="font-['JetBrains_Mono'] text-xs font-bold text-[#4bddb7] tracking-widest uppercase">
              Welcome Back
            </p>
            <h1 className="font-['Hanken_Grotesk'] text-4xl font-extrabold text-white leading-tight max-w-md">
              Your knowledge base is waiting.
            </h1>
          </div>

          {/* Pipeline Visual Stepper */}
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 font-['JetBrains_Mono'] text-[10px] text-[#c8c4d7] flex items-center gap-2">
              <span>Extract</span>
              <span className="material-symbols-outlined text-[12px] text-white/50">arrow_forward</span>
            </div>
            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 font-['JetBrains_Mono'] text-[10px] text-[#c8c4d7] flex items-center gap-2">
              <span>Chunk</span>
              <span className="material-symbols-outlined text-[12px] text-white/50">arrow_forward</span>
            </div>
            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 font-['JetBrains_Mono'] text-[10px] text-[#c8c4d7] flex items-center gap-2">
              <span>Embed</span>
              <span className="material-symbols-outlined text-[12px] text-white/50">arrow_forward</span>
            </div>
            <div className="px-4 py-2 rounded-full border border-[#6c5ce7]/30 bg-[#6c5ce7]/10 font-['JetBrains_Mono'] text-[10px] text-[#c6bfff] flex items-center gap-2">
              <span>Answer</span>
            </div>
          </div>

        </div>

        {/* Security & Speed Certifications */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#6c5ce7]/50 transition-colors">
              <span className="material-symbols-outlined text-white/70 group-hover:text-[#6c5ce7] text-lg">lock</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">End-to-End Encryption</p>
              <p className="text-xs text-[#c8c4d7]/60">AES-256 standard across all vectors.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#4bddb7]/50 transition-colors">
              <span className="material-symbols-outlined text-white/70 group-hover:text-[#4bddb7] text-lg">verified</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">SOC 2 Type II Certified</p>
              <p className="text-xs text-[#c8c4d7]/60">Enterprise-grade compliance ready.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#ffb77d]/50 transition-colors">
              <span className="material-symbols-outlined text-white/70 group-hover:text-[#ffb77d] text-lg">bolt</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Millisecond Retrieval</p>
              <p className="text-xs text-[#c8c4d7]/60">High-performance RAG orchestration.</p>
            </div>
          </div>
        </div>

      </section>

      {/* Right Panel (Form Area) */}
      <section className="flex-grow flex flex-col justify-between items-center py-12 px-6 md:px-12 relative z-10 min-h-screen">
        
        {/* Mobile Logo / Top Spacing Anchor */}
        <div className="flex items-center justify-center w-full min-h-[40px]">
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">shield</span>
            </div>
            <span className="font-['Hanken_Grotesk'] text-xl font-bold tracking-tight text-white">Vector Vault</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-[460px] bg-[#11141c]/70 backdrop-blur-xl p-8 sm:p-10 rounded-[20px] border border-white/5 shadow-2xl relative my-auto">
          
          <header className="mb-8 text-left">
            <h2 className="font-['Hanken_Grotesk'] text-2xl font-bold text-white mb-2">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </h2>
            <p className="text-sm text-[#c8c4d7]/60">
              {isSignUp ? "Get started with the infrastructure for AI." : "Welcome back to the infrastructure for AI."}
            </p>
          </header>

          {/* Google OAuth Button */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-12 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-medium text-white text-sm group cursor-pointer"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-grow bg-white/5"></div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#c8c4d7]/40 uppercase tracking-widest">or</span>
            <div className="h-px flex-grow bg-white/5"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Full Name */}
            {isSignUp && (
              <div className="space-y-2 group">
                <label className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#c8c4d7]/70 flex justify-between items-center px-1">
                  <span>Full Name</span>
                  <span className="material-symbols-outlined text-[14px] group-focus-within:text-[#6C5CE7] transition-colors">person</span>
                </label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 bg-[#0d1c2d]/70 border border-white/5 rounded-lg px-4 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50 transition-all text-sm font-sans placeholder:text-[#c8c4d7]/30"
                  required
                />
              </div>
            )}

            {/* Work Email */}
            <div className="space-y-2 group">
              <label className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#c8c4d7]/70 flex justify-between items-center px-1">
                <span>Work Email</span>
                <span className="material-symbols-outlined text-[14px] group-focus-within:text-[#6C5CE7] transition-colors">mail</span>
              </label>
              <input 
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#0d1c2d]/70 border border-white/5 rounded-lg px-4 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50 transition-all text-sm font-mono placeholder:text-[#c8c4d7]/30"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center px-1">
                <label className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#c8c4d7]/70 flex items-center gap-2">
                  <span>Password</span>
                  <span className="material-symbols-outlined text-[14px] group-focus-within:text-[#6C5CE7] transition-colors">lock</span>
                </label>
                {!isSignUp && (
                  <a href="#forgot" className="text-[11px] font-['JetBrains_Mono'] text-[#6C5CE7] hover:text-[#5847d2] transition-colors">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-[#0d1c2d]/70 border border-white/5 rounded-lg px-4 pr-12 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]/50 transition-all text-sm font-mono placeholder:text-[#c8c4d7]/30"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c8c4d7]/50 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            {!isSignUp && (
              <div className="flex items-center gap-2 px-1 py-1">
                <input 
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-[#0d1c2d] text-[#6C5CE7] focus:ring-[#6C5CE7]/30 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs text-[#c8c4d7]/60 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-[#6c5ce7] hover:bg-[#5847d2] text-white font-semibold transition-all shadow-[0_4px_20px_rgba(108,92,231,0.25)] flex items-center justify-center gap-2 group cursor-pointer text-sm"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isSignUp ? "Sign up" : "Sign in"}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    {isSignUp ? "how_to_reg" : "login"}
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Footer Info */}
          <footer className="mt-8 text-center space-y-4">
            <p className="text-[13px] text-[#c8c4d7]/60">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <Link to="/signin" className="text-[#6C5CE7] font-semibold hover:underline underline-offset-4">
                    Sign in here
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-[#6C5CE7] font-semibold hover:underline underline-offset-4">
                    Get started free
                  </Link>
                </>
              )}
            </p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#c8c4d7]/40 font-['JetBrains_Mono']">
              <span className="material-symbols-outlined text-[14px]">security</span>
              <span>Secured with 256-bit encryption</span>
            </div>
          </footer>

        </div>

        {/* Global Footer Links */}
        <div className="flex items-center justify-center gap-6 opacity-30 hover:opacity-60 transition-opacity whitespace-nowrap text-[11px] font-['JetBrains_Mono'] mt-8">
          <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-white/50"></span>
          <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
          <span className="w-1 h-1 rounded-full bg-white/50"></span>
          <a href="#support" className="hover:text-white transition-colors">Contact Support</a>
        </div>

      </section>

    </main>
  );
}