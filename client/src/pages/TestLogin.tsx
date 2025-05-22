import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      // Using a direct fetch here to bypass any issues with the apiRequest function
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: "Welcome back to CarFlow",
      });
      
      console.log('Login response:', data);
      
      // Store user info in local storage
      localStorage.setItem("carflow_token", data.token);
      localStorage.setItem("carflow_user", JSON.stringify(data.user));
      
      // Redirect to dashboard
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate();
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] dark:bg-[#111827] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#4448c5] rounded-full flex items-center justify-center">
              <i className="ri-car-line text-white text-2xl"></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Simple Login</CardTitle>
          <CardDescription>
            Try one of these test accounts:
            <div className="mt-2 text-left p-2 bg-blue-50 dark:bg-blue-900 rounded-md">
              <p><strong>Username:</strong> test | <strong>Password:</strong> test123</p>
              <p className="mt-1"><strong>Username:</strong> admin | <strong>Password:</strong> admin123</p>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#4448c5] hover:bg-[#3a3db0]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-center text-gray-500">
            Note: This is a simplified login page for testing.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}