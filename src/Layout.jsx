import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Users, Book, Sparkles, ScrollText, Target, BarChart3, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Диалоги",
    url: createPageUrl("Chat"),
    icon: MessageSquare,
  },
  {
    title: "NPC",
    url: createPageUrl("NPCManagement"),
    icon: Users,
  },
  {
    title: "Лор",
    url: createPageUrl("LoreManagement"),
    icon: Book,
  },
  {
    title: "Канон",
    url: createPageUrl("CanonManagement"),
    icon: Sparkles,
  },
  {
    title: "Квесты",
    url: createPageUrl("QuestManagement"),
    icon: Target,
  },
  {
    title: "Статистика",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <Sidebar className="border-r border-indigo-900/30 bg-slate-950/50 backdrop-blur-xl">
          <SidebarHeader className="border-b border-indigo-900/30 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <ScrollText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  NPC Нейросеть
                </h2>
                <p className="text-xs text-slate-400">Система диалогов</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
                Навигация
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-indigo-900/30 hover:text-violet-300 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-violet-900/40 to-indigo-900/40 text-violet-300 shadow-lg shadow-violet-500/10' 
                            : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
                Система
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-3 space-y-3">
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-violet-950/30 to-indigo-950/30 border border-violet-900/20">
                    <span className="text-slate-300">Версия</span>
                    <span className="font-semibold text-violet-400">1.0 MVP</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gradient-to-r from-green-950/30 to-emerald-950/30 border border-green-900/20">
                    <span className="text-slate-300">Статус</span>
                    <span className="font-semibold text-green-400">● Активна</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-indigo-900/30 p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-900/50 to-indigo-900/30">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                А
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-200 text-sm truncate">Администратор</p>
                <p className="text-xs text-slate-400 truncate">Управление системой</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-slate-950/30 backdrop-blur-xl border-b border-indigo-900/30 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-indigo-900/30 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-semibold text-slate-100">NPC Нейросеть</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}