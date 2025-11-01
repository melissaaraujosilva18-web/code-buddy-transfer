import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Sparkles, Star, Grid3x3 } from "lucide-react";

const categories = [
  { id: "populares", label: "Populares", icon: Star },
  { id: "fortune-tiger", label: "Fortune Tiger", icon: Flame },
  { id: "cassino", label: "Cassino", icon: Sparkles },
  { id: "todos", label: "Todos os Jogos", icon: Grid3x3 },
];

export function CategoryTabs() {
  return (
    <Tabs defaultValue="populares" className="w-full">
      <TabsList className="w-full justify-start flex flex-wrap bg-transparent h-auto p-2 md:p-3 gap-2 md:gap-3">
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card/40 text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 sm:px-4 py-2 min-h-[40px] text-xs sm:text-sm snap-start"
          >
            <category.icon className="h-4 w-4 flex-shrink-0" />
            <span>{category.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}