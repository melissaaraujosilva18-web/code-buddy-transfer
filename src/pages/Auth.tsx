import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { z } from "zod";
import { Mail, Lock, User, CreditCard } from "lucide-react";
import bannerBonus from "@/assets/banner-bonus.png";
import bannerLogin from "@/assets/banner-login.png";
import { importUsersFromCSV } from "@/utils/importUsers";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos e condições",
  }),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "signup" ? "signup" : "login");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const validation = loginSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao VortexBet",
      });

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error.message === "Invalid login credentials") {
        toast({
          title: "Erro ao fazer login",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao fazer login",
          description: error.message || "Tente novamente",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const cpf = formData.get("cpf") as string;
    const password = formData.get("password") as string;

    try {
      const validation = signupSchema.parse({ fullName, email, cpf, password, acceptTerms });

      const { error } = await supabase.auth.signUp({
        email: validation.email,
        password: validation.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validation.fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Bem-vindo ao VortexBet!",
      });

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else if (error.message?.includes("already registered")) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está em uso. Faça login ou use outro email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conta",
          description: error.message || "Tente novamente",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportUsers = async () => {
    setIsLoading(true);
    try {
      const result = await importUsersFromCSV();
      toast({
        title: "Importação concluída!",
        description: `Sucesso: ${result.results.success.length} usuários. Falhas: ${result.results.failed.length}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/95 p-4">
      <Dialog open={true} onOpenChange={(open) => !open && navigate("/")}>
        <DialogContent className="max-w-[90vw] sm:max-w-md p-0 bg-[#1a1a1a] border-none overflow-hidden">
          <div className="relative h-[180px] sm:h-[200px] overflow-hidden">
            {activeTab === "login" ? (
              <img src={bannerLogin} alt="Seja Bem-Vindo(a)" className="w-full h-full object-cover" />
            ) : (
              <img src={bannerBonus} alt="Bônus de Boas Vindas" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="login" className="mt-0">
                <h3 className="text-2xl font-bold text-white text-center mb-6">Entrar</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Digite o E-mail"
                      required
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Digite a senha"
                      required
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-semibold text-base shadow-[0_0_20px_hsl(var(--neon-green-glow)/0.3)]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="text-center">
                    <span className="text-white text-sm">Ainda não possui uma conta? </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
                    >
                      Registrar
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <h3 className="text-2xl font-bold text-white text-center mb-6">Registrar</h3>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="text"
                      name="fullName"
                      placeholder="Digite o nome"
                      required
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Digite o E-mail"
                      required
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="text"
                      name="cpf"
                      placeholder="Digite seu CPF"
                      required
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Digite a senha"
                      required
                      minLength={6}
                      className="pl-11 bg-[#2a2a2a] border-none text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-white cursor-pointer">
                      Eu concordo com os{" "}
                      <span className="text-primary hover:text-primary/80 transition-colors">
                        termos e condições
                      </span>
                      .
                    </label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-semibold text-base shadow-[0_0_20px_hsl(var(--neon-green-glow)/0.3)]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "Registrar"}
                  </Button>
                  <div className="text-center">
                    <span className="text-white text-sm">Já possui uma conta? </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
                    >
                      Entrar
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <Button
                onClick={handleImportUsers}
                variant="outline"
                className="w-full bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                disabled={isLoading}
              >
                {isLoading ? "Importando..." : "Importar Usuários do CSV"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
