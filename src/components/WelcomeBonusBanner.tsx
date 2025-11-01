import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeBonusBannerProps {
  onClose: () => void;
  onRescue: () => void;
}

export const WelcomeBonusBanner = ({ onClose, onRescue }: WelcomeBonusBannerProps) => {
  const bonusInUSD = 136.05;

  return (
    <div className="w-full bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 border-b-2 border-yellow-500/50 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite]"></div>

      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
            <span className="text-2xl animate-pulse">🎁</span>
          </div>
          <div>
            <p className="text-yellow-500 dark:text-yellow-400 text-xs sm:text-sm md:text-base font-bold leading-tight">
              🎉 Welcome Bonus Available!
            </p>
            <p className="text-yellow-600/80 dark:text-yellow-500/80 text-[10px] sm:text-xs mt-0.5">
              You will receive ${bonusInUSD.toFixed(2)} (converted to BRL) after your first deposit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onRescue}
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 h-auto text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300 rounded-full"
          >
            ⚡ Claim Now
          </Button>
          <button
            onClick={onClose}
            className="text-yellow-600/70 hover:text-yellow-500 transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};