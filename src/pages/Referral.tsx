import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const referralLink = `https://vortexbet.com/ref/${user?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vortexbet - Convite",
          text: "Jogue comigo na Vortexbet e ganhe bônus!",
          url: referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Indicar Amigos</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seu Link de Indicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-muted"
                />
                <Button onClick={handleCopyLink} size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center py-4">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={referralLink} size={200} />
                </div>
              </div>

              <Button onClick={handleShare} className="w-full" size="lg">
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Funciona?</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside">
                <li>Compartilhe seu link de indicação com amigos</li>
                <li>Quando seus amigos se cadastrarem usando seu link</li>
                <li>Você receberá bônus especiais a cada indicação</li>
                <li>Quanto mais amigos, mais bônus você ganha!</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
