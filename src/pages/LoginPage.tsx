import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error("Username atau password salah");
      }

      const data = await res.json();
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Login ke Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Gunakan username dan password yang diberikan oleh admin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-2">
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-2">
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Masuk
              </Button>
            </form>
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Demo Akun:</p>
              <p>Admin: admin / password</p>
              <p>Guru: guru1 / password</p>
              <p>Siswa: siswa1 / password</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
