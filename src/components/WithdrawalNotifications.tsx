import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Withdrawal {
  id: number;
  amount: number;
  name: string;
}

const mockWithdrawals: Withdrawal[] = [
  { id: 1, amount: 735, name: "Eduarda M****" },
  { id: 2, amount: 760, name: "Tiago R****" },
  { id: 3, amount: 700, name: "Laura A****" },
  { id: 4, amount: 750, name: "Claudio J****" },
  { id: 5, amount: 770, name: "Patricia A****" },
  { id: 6, amount: 715, name: "Juliana O****" },
  { id: 7, amount: 730, name: "Felipe S****" },
  { id: 8, amount: 775, name: "Victor T****" },
];

export function WithdrawalNotifications() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockWithdrawals.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const visibleWithdrawals = [
    mockWithdrawals[currentIndex],
    mockWithdrawals[(currentIndex + 1) % mockWithdrawals.length],
    mockWithdrawals[(currentIndex + 2) % mockWithdrawals.length],
    mockWithdrawals[(currentIndex + 3) % mockWithdrawals.length],
  ];

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 sm:p-6 border border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 animate-pulse">
            <span className="text-lg">💰</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">Saques Recentes</h3>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Ao vivo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {visibleWithdrawals.map((withdrawal, index) => (
            <Card
              key={`${withdrawal.id}-${index}`}
              className={`p-2.5 sm:p-3.5 md:p-4 border-primary/30 bg-card/80 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--neon-green-glow)/0.3)] ${
                isVisible
                  ? "opacity-100 translate-y-0 border-primary/50 shadow-[0_0_15px_hsl(var(--neon-green-glow)/0.2)]"
                  : "opacity-0 -translate-y-2"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Saque aprovado
                  </p>
                  <p className="text-base sm:text-xl md:text-2xl font-black text-primary drop-shadow-[0_0_10px_hsl(var(--neon-green-glow)/0.5)]">
                    R$ {withdrawal.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/80 mt-0.5 sm:mt-1 font-medium truncate">
                    {withdrawal.name}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 border-2 border-primary/30">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}