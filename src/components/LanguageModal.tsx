import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (language: 'pt-BR' | 'en-US') => void;
}

export const LanguageModal = ({ isOpen, onClose, onSelectLanguage }: LanguageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Escolha o Idioma</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 justify-center py-6">
          <button
            onClick={() => {
              onSelectLanguage('pt-BR');
              onClose();
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-32 h-24 rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://flagcdn.com/w320/br.png"
                alt="Bandeira do Brasil"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
          <button
            onClick={() => {
              onSelectLanguage('en-US');
              onClose();
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-32 h-24 rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://flagcdn.com/w320/us.png"
                alt="USA Flag"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};