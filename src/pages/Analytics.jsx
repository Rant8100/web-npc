import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MessageSquare, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export default function AnalyticsPage() {
  const { data: messages } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 1000),
    initialData: [],
  });

  const { data: canonAnswers } = useQuery({
    queryKey: ['canonAnswers'],
    queryFn: () => base44.entities.CanonAnswer.list(),
    initialData: [],
  });

  const { data: npcs } = useQuery({
    queryKey: ['npcs'],
    queryFn: () => base44.entities.NPC.list(),
    initialData: [],
  });

  const { data: quests } = useQuery({
    queryKey: ['quests'],
    queryFn: () => base44.entities.Quest.list(),
    initialData: [],
  });

  const totalMessages = messages.length;
  const npcMessages = messages.filter(m => m.sender === 'npc').length;
  const canonUsageCount = messages.filter(m => m.used_canon).length;
  const canonHitRate = npcMessages > 0 ? ((canonUsageCount / npcMessages) * 100).toFixed(1) : 0;

  const intentUsage = messages
    .filter(m => m.intent_matched)
    .reduce((acc, m) => {
      acc[m.intent_matched] = (acc[m.intent_matched] || 0) + 1;
      return acc;
    }, {});

  const topIntents = Object.entries(intentUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([intent, count]) => ({ intent, count }));

  const npcActivity = messages.reduce((acc, m) => {
    if (m.npc_id) {
      const npc = npcs.find(n => n.id === m.npc_id);
      const name = npc?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});

  const npcActivityData = Object.entries(npcActivity)
    .sort(([,a], [,b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  const canonVsGenerated = [
    { name: 'Канонические', value: canonUsageCount, color: '#a855f7' },
    { name: 'Генерируемые', value: npcMessages - canonUsageCount, color: '#6366f1' }
  ];

  const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Аналитика Системы
          </h1>
          <p className="text-slate-400 mt-1">Метрики производительности и использования</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Всего сообщений</p>
                    <p className="text-3xl font-bold text-slate-100">{totalMessages}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-violet-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Hit-Rate Канона</p>
                    <p className="text-3xl font-bold text-slate-100">{canonHitRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Активных NPC</p>
                    <p className="text-3xl font-bold text-slate-100">{npcs.filter(n => n.active).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Квестов</p>
                    <p className="text-3xl font-bold text-slate-100">{quests.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Топ-10 Интентов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topIntents}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="intent" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Активность NPC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={canonVsGenerated}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {canonVsGenerated.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Сообщений по NPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={npcActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Ключевые Метрики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-2">Канонических ответов</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-violet-400">{canonAnswers.length}</p>
                  <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-xs">
                    интентов
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-2">Средний интентов на NPC</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-indigo-400">
                    {npcs.length > 0 ? (canonAnswers.length / npcs.length).toFixed(1) : 0}
                  </p>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">
                    среднее
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-sm text-slate-400 mb-2">Уникальных интентов</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-purple-400">{Object.keys(intentUsage).length}</p>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                    всего
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}