import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  has_deposited: boolean;
  bonus_claimed: boolean;
  pix_key: string | null;
  pix_key_type: 'cpf' | 'email' | 'phone' | 'random' | null;
  pix_name: string | null;
  withdrawal_status: 'processing' | 'awaiting_fee' | null;
  withdrawal_amount: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Verificar se o usuário está bloqueado
        if (data.blocked) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          navigate("/auth");
          throw new Error("Conta bloqueada. Entre em contato com o suporte.");
        }

        setProfile({
          ...data,
          withdrawal_status: data.withdrawal_status as 'processing' | 'awaiting_fee' | null,
          pix_key_type: data.pix_key_type as 'cpf' | 'email' | 'phone' | 'random' | null,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime subscription to profile updates (e.g., balance)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-updates:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const newRow = payload.new as any;
          setProfile((prev) => prev ? {
            ...prev,
            ...newRow,
            withdrawal_status: newRow.withdrawal_status as 'processing' | 'awaiting_fee' | null,
            pix_key_type: newRow.pix_key_type as 'cpf' | 'email' | 'phone' | 'random' | null,
          } : {
            id: newRow.id,
            email: newRow.email,
            full_name: newRow.full_name,
            balance: Number(newRow.balance),
            has_deposited: !!newRow.has_deposited,
            bonus_claimed: !!newRow.bonus_claimed,
            pix_key: newRow.pix_key,
            pix_key_type: newRow.pix_key_type as 'cpf' | 'email' | 'phone' | 'random' | null,
            pix_name: newRow.pix_name,
            withdrawal_status: newRow.withdrawal_status as 'processing' | 'awaiting_fee' | null,
            withdrawal_amount: Number(newRow.withdrawal_amount),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}