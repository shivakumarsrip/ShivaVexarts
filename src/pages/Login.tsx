import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus } from "lucide-react";

type Mode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

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
    } else {
      signupMutation.mutate({ email, password, name: name || undefined });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-[#18181B] border-[#27272A] shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-[#F59E0B]/15 rounded-xl flex items-center justify-center mx-auto mb-3">
            {mode === "login" ? (
              <LogIn size={22} className="text-[#F59E0B]" />
            ) : (
              <UserPlus size={22} className="text-[#F59E0B]" />
            )}
          </div>
          <CardTitle className="font-display text-[26px] text-white">
            {mode === "login" ? "Welcome back" : "Create account"}
          </CardTitle>
          <CardDescription className="text-[#71717A] font-body text-[13px]">
            {mode === "login"
              ? "Sign in to your Shiva Vexarts account"
              : "Join Shiva Vexarts today"}
          </CardDescription>
        </CardHeader>

        <CardContent>
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

            <div>
              <Label className="text-[#A1A1AA] text-[12px] mb-1.5 block">Password</Label>
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

            {error && (
              <p className="text-[#EF4444] font-body text-[13px] bg-[#EF4444]/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] font-body font-semibold rounded-lg py-5 mt-2"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : mode === "login" ? (
                <LogIn size={16} className="mr-2" />
              ) : (
                <UserPlus size={16} className="mr-2" />
              )}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
