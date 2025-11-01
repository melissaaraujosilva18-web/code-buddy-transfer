import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import bannerIphone from "@/assets/banner-iphone.png";
import bannerLegalizada from "@/assets/banner-legalizada.png";
import bannerBonus from "@/assets/banner-bonus.png";

const promos = [
  { id: 1, image: bannerBonus },
  { id: 2, image: bannerIphone },
  { id: 3, image: bannerLegalizada },
];

export function PromoCarousel() {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {promos.map((promo) => (
          <CarouselItem key={promo.id}>
            <div className="aspect-[3/1] sm:aspect-[16/7] md:aspect-[16/6]">
              <Card className="relative overflow-hidden border-0 h-full group cursor-pointer rounded-xl sm:rounded-2xl">
                <img
                  src={promo.image}
                  alt={`Banner promocional ${promo.id}`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 h-8 w-8 sm:h-10 sm:w-10 bg-black/50 hover:bg-black/70 border-white/20" />
      <CarouselNext className="right-2 h-8 w-8 sm:h-10 sm:w-10 bg-black/50 hover:bg-black/70 border-white/20" />
    </Carousel>
  );
}