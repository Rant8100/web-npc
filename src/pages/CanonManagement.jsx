
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, Edit, Tag } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["greeting", "farewell", "quest", "location", "trade", "lore", "meta", "other"];

export default function CanonManagementPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCanon, setEditingCanon] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    npc_id: "",
    intent: "",
    pattern_examples: "",
    reply: "",
    stage_directions: "",
    category: "other",
    priority: 1
  });

  const { data: npcs } = useQuery({
    queryKey: ['npcs'],
    queryFn: () => base44.entities.NPC.list(),
    initialData: [],
  });

  const { data: canonAnswers, isLoading } = useQuery({
    queryKey: ['canonAnswers', selectedNPC],
    queryFn: () => selectedNPC === "all" 
      ? base44.entities.CanonAnswer.list('-created_date')
      : base44.entities.CanonAnswer.filter({ npc_id: selectedNPC }, '-created_date'),
    initialData: [],
  });

  const createCanonMutation = useMutation({
    mutationFn: (data) => base44.entities.CanonAnswer.create({
      ...data,
      pattern_examples: data.pattern_examples.split(',').map(p => p.trim()).filter(Boolean),
      priority: parseFloat(data.priority) || 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canonAnswers'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateCanonMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CanonAnswer.update(id, {
      ...data,
      pattern_examples: data.pattern_examples.split(',').map(p => p.trim()).filter(Boolean),
      priority: parseFloat(data.priority) || 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canonAnswers'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      npc_id: "",
      intent: "",
      pattern_examples: "",
      reply: "",
      stage_directions: "",
      category: "other",
      priority: 1
    });
    setEditingCanon(null);
  };

  const handleEdit = (canon) => {
    setEditingCanon(canon);
    setFormData({
      npc_id: canon.npc_id,
      intent: canon.intent,
      pattern_examples: canon.pattern_examples?.join(', ') || "",
      reply: canon.reply,
      stage_directions: canon.stage_directions || "",
      category: canon.category || "other",
      priority: canon.priority || 1
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingCanon) {
      updateCanonMutation.mutate({ id: editingCanon.id, data: formData });
    } else {
      createCanonMutation.mutate(formData);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      greeting: "border-green-500/30 text-green-400",
      farewell: "border-blue-500/30 text-blue-400",
      quest: "border-amber-500/30 text-amber-400",
      location: "border-purple-500/30 text-purple-400",
      trade: "border-emerald-500/30 text-emerald-400",
      lore: "border-cyan-500/30 text-cyan-400",
      meta: "border-red-500/30 text-red-400",
      other: "border-slate-500/30 text-slate-400"
    };
    return colors[category] || colors.other;
  };

  const groupedByNPC = canonAnswers.reduce((acc, canon) => {
    const npc = npcs.find(n => n.id === canon.npc_id);
    const key = npc ? npc.name : "Неизвестный NPC";
    if (!acc[key]) acc[key] = [];
    acc[key].push(canon);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Канонические Ответы
            </h1>
            <p className="text-slate-400 mt-1">Детерминированные ответы для интентов NPC</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedNPC} onValueChange={setSelectedNPC}>
              <SelectTrigger className="w-48 bg-slate-900/50 border-indigo-900/30 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-indigo-900/30">
                <SelectItem value="all" className="text-slate-200">Все NPC</SelectItem>
                {npcs.map((npc) => (
                  <SelectItem key={npc.id} value={npc.id} className="text-slate-200">
                    {npc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить Канон
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-900 border-indigo-900/30 text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingCanon ? 'Редактировать Канон' : 'Новый Канон'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <Label htmlFor="npc_id" className="text-slate-300">NPC</Label>
                    <Select
                      value={formData.npc_id}
                      onValueChange={(value) => setFormData({...formData, npc_id: value})}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                        <SelectValue placeholder="Выберите NPC" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-indigo-900/30">
                        {npcs.map((npc) => (
                          <SelectItem key={npc.id} value={npc.id} className="text-slate-200">
                            {npc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="intent" className="text-slate-300">Интент</Label>
                      <Input
                        id="intent"
                        value={formData.intent}
                        onChange={(e) => setFormData({...formData, intent: e.target.value})}
                        placeholder="greeting"
                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-slate-300">Категория</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-indigo-900/30">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-slate-200">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pattern_examples" className="text-slate-300">Примеры триггер-фраз (через запятую)</Label>
                    <Textarea
                      id="pattern_examples"
                      value={formData.pattern_examples}
                      onChange={(e) => setFormData({...formData, pattern_examples: e.target.value})}
                      placeholder="привет, здравствуй, добрый день"
                      className="bg-slate-800/50 border-slate-700 text-slate-100 h-20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reply" className="text-slate-300">Канонический ответ</Label>
                    <Textarea
                      id="reply"
                      value={formData.reply}
                      onChange={(e) => setFormData({...formData, reply: e.target.value})}
                      placeholder="[кивнул] Чужак, ступай ближе, но не шуми."
                      className="bg-slate-800/50 border-slate-700 text-slate-100 h-24"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stage_directions" className="text-slate-300">Сценические ремарки (опционально)</Label>
                    <Input
                      id="stage_directions"
                      value={formData.stage_directions}
                      onChange={(e) => setFormData({...formData, stage_directions: e.target.value})}
                      placeholder="кивнул, хмыкнул"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-slate-300">Приоритет</Label>
                    <Input
                      id="priority"
                      type="number"
                      step="0.1"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      placeholder="1"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    disabled={createCanonMutation.isPending || updateCanonMutation.isPending}
                  >
                    {editingCanon ? 'Сохранить изменения' : 'Создать Канон'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByNPC).map(([npcName, canons], npcIdx) => (
            <motion.div
              key={npcName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: npcIdx * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    {npcName}
                    <Badge variant="outline" className="ml-2 border-violet-500/30 text-violet-400">
                      {canons.length} интентов
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {canons.map((canon) => (
                      <div
                        key={canon.id}
                        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-violet-500/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getCategoryColor(canon.category)}>
                              {canon.category}
                            </Badge>
                            <span className="text-sm font-mono text-slate-300">{canon.intent}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(canon)}
                            className="text-slate-400 hover:text-violet-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Триггеры:</p>
                            <div className="flex flex-wrap gap-1">
                              {canon.pattern_examples?.slice(0, 3).map((pattern, i) => (
                                <Badge key={i} variant="outline" className="text-xs border-indigo-500/20 text-slate-400">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {pattern}
                                </Badge>
                              ))}
                              {canon.pattern_examples?.length > 3 && (
                                <Badge variant="outline" className="text-xs border-indigo-500/20 text-slate-400">
                                  +{canon.pattern_examples.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 mb-1">Ответ:</p>
                            <p className="text-sm text-slate-200 italic">"{canon.reply}"</p>
                          </div>

                          {canon.stage_directions && (
                            <div>
                              <p className="text-xs text-slate-400">Ремарки: {canon.stage_directions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {canonAnswers.length === 0 && !isLoading && (
          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl p-12">
            <div className="text-center text-slate-400">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Нет канонических ответов</h3>
              <p>Добавьте первые интенты для выбранных NPC</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
