import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast.success("Bem-vindo de volta!");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Erro ao entrar. Verifica as tuas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      });
      if (error) throw error;
      toast.success("Conta criada! Já podes entrar.");
    } catch (error) {
      toast.error(error.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-teal-500/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass border-primary/20">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold">Acesso Professor</CardTitle>
            <CardDescription className="font-body text-muted-foreground">
              Entra para gerir a tua escola ou criar uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="email@escola.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" disabled={loading} className="w-full h-11 eco-gradient">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  disabled={loading} 
                  onClick={handleSignUp}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Criar conta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
