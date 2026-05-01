import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus, KeyRound, ArrowLeft, Mail } from "lucide-react";

type Mode = "login" | "signup" | "forgot_password";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (e) => setError(e.message),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate("/");
    },
    onError: (e) => setError(e.message),
  });

  const isPending = loginMutation.isPending || signupMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else if (mode === "signup") {
      signupMutation.mutate({ email, password, name: name || undefined });
    } else {
      // Handle forgot password "simulation"
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-[#18181B] border-[#27272A] shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-[#F59E0B]/15 rounded-xl flex items-center justify-center mx-auto mb-3">
            {mode === "login" ? (
              <LogIn size={22} className="text-[#F59E0B]" />
            ) : mode === "signup" ? (
              <UserPlus size={22} className="text-[#F59E0B]" />
            ) : (
              <KeyRound size={22} className="text-[#F59E0B]" />
            )}
          </div>
          <CardTitle className="font-display text-[26px] text-white">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset Password"}
          </CardTitle>
          <CardDescription className="text-[#71717A] font-body text-[13px]">
            {mode === "login"
              ? "Sign in to your Shiva Vexarts account"
              : mode === "signup"
              ? "Join Shiva Vexarts today"
              : "Enter your email to recover your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {resetSent ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-[#16A34A]/10 rounded-full flex items-center justify-center mx-auto">
                <Mail size={32} className="text-[#16A34A]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-body font-bold text-[18px]">Check your inbox</h3>
                <p className="text-[#A1A1AA] font-body text-[14px] leading-relaxed">
                  We have sent instructions to <b>{email}</b>. Please follow the link in the email to reset your password.
                </p>
                <p className="text-[#71717A] font-body text-[12px] italic mt-4">
                  (Note: For local development, please check the server logs for the reset token)
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-[#3F3F46] text-white hover:bg-white/5"
                onClick={() => { setMode("login"); setResetSent(false); }}
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label className="text-[#A1A1AA] text-[12px] mb-1.5 block">
                      Name <span className="text-[#52525B]">(optional)</span>
                    </Label>
                    <Input
                      id="login-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-[#09090B] border-[#3F3F46] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus-visible:ring-0"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-[#A1A1AA] text-[12px] mb-1.5 block">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-[#09090B] border-[#3F3F46] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus-visible:ring-0"
                  />
                </div>

                {mode !== "forgot_password" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-[#A1A1AA] text-[12px]">Password</Label>
                      {mode === "login" && (
                        <button 
                          type="button" 
                          onClick={() => setMode("forgot_password")}
                          className="text-[#F59E0B] hover:text-[#D97706] text-[12px] font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                      required
                      minLength={mode === "signup" ? 8 : 1}
                      className="bg-[#09090B] border-[#3F3F46] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus-visible:ring-0"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-[#EF4444] font-body text-[13px] bg-[#EF4444]/10 rounded-lg px-3 py-2 text-center">
                    {error}
                  </p>
                )}

                <Button
                  id="login-submit"
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] font-body font-semibold rounded-lg py-5 mt-2 transition-all active:scale-[0.98]"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : mode === "login" ? (
                    <LogIn size={16} className="mr-2" />
                  ) : mode === "signup" ? (
                    <UserPlus size={16} className="mr-2" />
                  ) : (
                    <KeyRound size={16} className="mr-2" />
                  )}
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-5 text-center">
                {mode === "forgot_password" ? (
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); }}
                    className="flex items-center justify-center gap-2 mx-auto text-[#71717A] hover:text-white font-body text-[13px] transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError("");
                    }}
                    className="text-[#71717A] hover:text-[#F59E0B] font-body text-[13px] transition-colors"
                  >
                    {mode === "login" ? (
                      <>Don't have an account? <span className="text-[#F59E0B]">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="text-[#F59E0B]">Sign in</span></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
