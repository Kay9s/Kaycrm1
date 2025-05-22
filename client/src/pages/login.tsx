import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Login successful",
        description: "Welcome back to CarFlow",
      });
      
      console.log('Login response:', data);
      
      if (data && data.user && data.token) {
        // Store user info in local storage with proper handling of snake_case column names
        localStorage.setItem("carflow_token", data.token);
        localStorage.setItem("carflow_user", JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name, // Using snake_case from database
          email: data.user.email,
          role: data.user.role
        }));
        
        // Redirect to dashboard
        setLocation("/");
      } else {
        console.error("Incomplete login response:", data);
        toast({
          title: "Login error",
          description: "Received invalid response from server",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      username: string;
      password: string;
      fullName: string;
      email: string;
    }) => {
      // Adjust field names to match server expectations (camelCase to snake_case)
      const serverData = {
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName, // Backend will handle the conversion to full_name
        email: userData.email
      };
      return apiRequest("POST", "/api/auth/register", serverData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      console.log('Registration response:', data);
      
      if (data && data.user && data.token) {
        // Store user info in local storage with proper handling of snake_case column names
        localStorage.setItem("carflow_token", data.token);
        localStorage.setItem("carflow_user", JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          fullName: data.user.full_name, // Using snake_case from database
          email: data.user.email,
          role: data.user.role
        }));
        
        // Redirect to dashboard
        setLocation("/");
      } else {
        console.error("Incomplete registration response:", data);
        toast({
          title: "Registration error",
          description: "Received invalid response from server",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({ username: loginUsername, password: loginPassword });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerUsername || !registerPassword || !registerFullName || !registerEmail) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      fullName: registerFullName,
      email: registerEmail,
    });
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
          <CardTitle className="text-2xl font-bold">Welcome to CarFlow</CardTitle>
          <CardDescription>
            Car rental management made simple
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="loginUsername">Username</Label>
                  <Input
                    id="loginUsername"
                    type="text"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="registerFullName">Full Name</Label>
                  <Input
                    id="registerFullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerUsername">Username</Label>
                  <Input
                    id="registerUsername"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Password</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    placeholder="Choose a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#4448c5] hover:bg-[#3a3db0]"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-center text-gray-500">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-[#4448c5] hover:underline"
                  onClick={() => setActiveTab("register")}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#4448c5] hover:underline"
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </button>
              </>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}