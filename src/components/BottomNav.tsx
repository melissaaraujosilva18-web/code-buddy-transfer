import { Menu, Home, DollarSign, Users, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavProps {
  onDepositClick: () => void;
  onMenuClick: () => void;
}

export const BottomNav = ({ onDepositClick, onMenuClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex items-center justify-around h-14 px-2">
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-normal">Menu</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] transition-colors ${
            isActive("/") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-normal">Home</span>
        </button>

        <button
          onClick={onDepositClick}
          className="relative -mt-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#00D632] to-[#00A326] shadow-md hover:shadow-lg transition-all hover:scale-105"
        >
          <DollarSign className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Users className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-normal">Convidar</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] transition-colors ${
            isActive("/profile") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[10px] font-normal">Perfil</span>
        </button>
      </div>
    </nav>
  );
};