import { Trophy, Gamepad2, Flame, FileText, HelpCircle, Heart, Shield } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import pixLogo from "@/assets/pix-logo.png";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const handleNavigate = (url: string) => {
    navigate(url);
    onClose();
  };

  const mainMenuItems = [
    { title: "Torneios VortexBet", url: "/", icon: Trophy, highlight: true },
    { title: "Todos os Jogos", url: "/", icon: Gamepad2 },
    { title: "Fortune Tiger", url: "/", icon: Flame },
  ];

  const footerItems = [
    { title: "Termos de Uso", url: "/", icon: FileText },
    { title: "FAQ", url: "/", icon: HelpCircle },
    { title: "Jogue Consciente", url: "/", icon: Heart },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] p-0 bg-background border-r border-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b border-border">
            <div className="text-xl font-bold">
              <span className="text-foreground">Vortex</span>
              <span className="text-primary">bet</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            <div className="space-y-1 px-2">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all ${
                      item.highlight
                        ? "bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30 text-yellow-500 font-medium"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">Painel Admin</span>
                </button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border px-2 space-y-1">
              {footerItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};