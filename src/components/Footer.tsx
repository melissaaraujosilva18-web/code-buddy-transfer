import { Link } from "react-router-dom";
import vortexbetLogo from "@/assets/vortexbet-logo.png";
import pixLogo from "@/assets/pix-footer-logo.svg";
import responsibleGamblingLogo from "@/assets/responsible-gambling-logo.svg";
import pciDssLogo from "@/assets/pci-dss-logo.svg";
import sigmaLogo from "@/assets/sigma-logo.png";
import cgfLogo from "@/assets/cgf-logo.svg";
import agePlus from "@/assets/18-plus.svg";

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/40 mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="mb-6 flex justify-center">
            <img src={vortexbetLogo} alt="Vortexbet" className="h-20 sm:h-24 md:h-28" />
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            vortex bet é um cassino online que oferece aos seus usuários uma experiência única de jogos de cassino. Com uma plataforma intuitiva e fácil de usar, vortex bet permite que seus usuários desfrutem de uma ampla variedade de jogos, incluindo os clássicos e os mais recentes lançamentos.
          </p>

          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm underline"
          >
            Ver mais
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-4">Carteira</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Depositar
                </button>
              </li>
              <li>
                <button className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Sacar
                </button>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-4">Ajuda</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-8 border-t border-border/40">
          <img src={pixLogo} alt="PIX" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          <img src={responsibleGamblingLogo} alt="Responsible Gambling" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          <img src={pciDssLogo} alt="PCI DSS Compliant" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          <img src={sigmaLogo} alt="SIGMA" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          <img src={cgfLogo} alt="CGF" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          <img src={agePlus} alt="18+" className="h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </footer>
  );
};