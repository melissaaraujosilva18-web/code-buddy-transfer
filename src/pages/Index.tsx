import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, User, Bell } from "lucide-react";
import { PromoCarousel } from "@/components/PromoCarousel";
import { CategoryTabs } from "@/components/CategoryTabs";
import { GameGrid } from "@/components/GameGrid";
import { WithdrawalNotifications } from "@/components/WithdrawalNotifications";
import { WelcomeBonusBanner } from "@/components/WelcomeBonusBanner";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { LanguageModal } from "@/components/LanguageModal";
import { BottomNav } from "@/components/BottomNav";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";
import vortexLogo from "@/assets/vortexbet-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showBonusBanner, setShowBonusBanner] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [language, setLanguage] = useState<'pt-BR' | 'en-US'>('pt-BR');

  useEffect(() => {
    const hasSeenLanguageModal = localStorage.getItem("hasSeenLanguageModal");
    if (!hasSeenLanguageModal) {
      setShowLanguageModal(true);
      localStorage.setItem("hasSeenLanguageModal", "true");
    }
  }, []);

  const handleDepositClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowDepositModal(true);
  };

  const handleWithdrawalClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowWithdrawalModal(true);
  };

  const handleRescueBonus = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    handleDepositClick();
  };

  const handleLanguageSelect = (selectedLanguage: 'pt-BR' | 'en-US') => {
    setLanguage(selectedLanguage);
    localStorage.setItem("language", selectedLanguage);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <img src={vortexLogo} alt="Vortexbet" className="h-8 md:h-10" />
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                >
                  <User className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-sm font-semibold text-primary">
                    R$ {Number(profile?.balance || 0).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} size="sm">
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Bonus Banner */}
      {showBonusBanner && user && !profile?.bonus_claimed && (
        <WelcomeBonusBanner
          onClose={() => setShowBonusBanner(false)}
          onRescue={handleRescueBonus}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Promo Carousel */}
        <section>
          <PromoCarousel />
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleDepositClick}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
          >
            💰 Depositar
          </Button>
          <Button
            onClick={handleWithdrawalClick}
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            💸 Sacar
          </Button>
        </section>

        {/* Withdrawal Notifications */}
        <WithdrawalNotifications />

        {/* Category Tabs */}
        <CategoryTabs />

        {/* Games Grid */}
        <GameGrid />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onDepositClick={handleDepositClick}
        onMenuClick={() => setShowMobileMenu(true)}
      />

      {/* Modals */}
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
      <DepositModal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />
      <WithdrawalModal isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} />
      <LanguageModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onSelectLanguage={handleLanguageSelect}
      />
    </div>
  );
};

export default Index;
