import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Trophy, Gamepad2, Flame, FileText, HelpCircle, Heart, Shield } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const menuItems = [
  { title: "Início", url: "/", icon: Trophy, highlight: true },
  { title: "Jogos", url: "/", icon: Gamepad2 },
  { title: "Populares", url: "/", icon: Flame },
];

const footerItems = [
  { title: "Termos de Uso", url: "/", icon: FileText },
  { title: "FAQ", url: "/", icon: HelpCircle },
  { title: "Jogue Consciente", url: "/", icon: Heart },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin } = useIsAdmin();

  return (
    <Sidebar className="border-r border-border bg-[hsl(var(--sidebar-bg))]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={item.highlight ? "bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary" : ""}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 transition-colors ${
                          isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="bg-gradient-to-r from-yellow-500/20 to-transparent border-l-2 border-yellow-500">
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `flex items-center gap-3 transition-colors ${
                          isActive ? "text-yellow-500 font-medium" : "text-yellow-500/70 hover:text-yellow-500"
                        }`
                      }
                    >
                      <Shield className="h-5 w-5" />
                      {open && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 text-sm transition-colors ${
                          isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
