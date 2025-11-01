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
import { Plus, Target, Edit, Award, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function QuestManagementPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    quest_id: "",
    npc_id: "",
    title: "",
    description: "",
    success_condition: "",
    reward: "",
    hints: "",
    difficulty: "medium"
  });

  const { data: npcs } = useQuery({
    queryKey: ['npcs'],
    queryFn: () => base44.entities.NPC.list(),
    initialData: [],
  });

  const { data: quests, isLoading } = useQuery({
    queryKey: ['quests', selectedNPC],
    queryFn: () => selectedNPC === "all" 
      ? base44.entities.Quest.list('-created_date')
      : base44.entities.Quest.filter({ npc_id: selectedNPC }, '-created_date'),
    initialData: [],
  });

  const createQuestMutation = useMutation({
    mutationFn: (data) => base44.entities.Quest.create({
      ...data,
      hints: data.hints.split('\n').map(h => h.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateQuestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quest.update(id, {
      ...data,
      hints: data.hints.split('\n').map(h => h.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      quest_id: "",
      npc_id: "",
      title: "",
      description: "",
      success_condition: "",
      reward: "",
      hints: "",
      difficulty: "medium"
    });
    setEditingQuest(null);
  };

  const handleEdit = (quest) => {
    setEditingQuest(quest);
    setFormData({
      quest_id: quest.quest_id,
      npc_id: quest.npc_id,
      title: quest.title,
      description: quest.description,
      success_condition: quest.success_condition || "",
      reward: quest.reward || "",
      hints: quest.hints?.join('\n') || "",
      difficulty: quest.difficulty || "medium"
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingQuest) {
      updateQuestMutation.mutate({ id: editingQuest.id, data: formData });
    } else {
      createQuestMutation.mutate(formData);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "border-green-500/30 text-green-400",
      medium: "border-amber-500/30 text-amber-400",
      hard: "border-red-500/30 text-red-400"
    };
    return colors[difficulty] || colors.medium;
  };

  const groupedByNPC = quests.reduce((acc, quest) => {
    const npc = npcs.find(n => n.id === quest.npc_id);
    const key = npc ? npc.name : "Неизвестный NPC";
    if (!acc[key]) acc[key] = [];
    acc[key].push(quest);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Управление Квестами
            </h1>
            <p className="text-slate-400 mt-1">Создание и редактирование заданий NPC</p>
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
                  Создать Квест
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-slate-900 border-indigo-900/30 text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {editingQuest ? 'Редактировать Квест' : 'Новый Квест'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quest_id" className="text-slate-300">ID квеста</Label>
                      <Input
                        id="quest_id"
                        value={formData.quest_id}
                        onChange={(e) => setFormData({...formData, quest_id: e.target.value})}
                        placeholder="quest_bridge_sign"
                        className="bg-slate-800/50 border-slate-700 text-slate-100"
                      />
                    </div>
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
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-slate-300">Название</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Знак моста"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-300">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Добудь клеймо с моста Волчьей Пасти"
                      className="bg-slate-800/50 border-slate-700 text-slate-100 h-20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="success_condition" className="text-slate-300">Условие выполнения</Label>
                    <Input
                      id="success_condition"
                      value={formData.success_condition}
                      onChange={(e) => setFormData({...formData, success_condition: e.target.value})}
                      placeholder="принести клеймо Волчьей Пасти"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reward" className="text-slate-300">Награда</Label>
                    <Input
                      id="reward"
                      value={formData.reward}
                      onChange={(e) => setFormData({...formData, reward: e.target.value})}
                      placeholder="ключ от склада"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hints" className="text-slate-300">Подсказки (3 уровня, каждая с новой строки)</Label>
                    <Textarea
                      id="hints"
                      value={formData.hints}
                      onChange={(e) => setFormData({...formData, hints: e.target.value})}
                      placeholder={"Ищи знак в форме волчьей лапы на старом мосту.\nСледы ведут к северу от каменного столба.\nПод плитой у перил моста."}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 h-24 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="difficulty" className="text-slate-300">Сложность</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({...formData, difficulty: value})}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-indigo-900/30">
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff} className="text-slate-200">
                            {diff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    disabled={createQuestMutation.isPending || updateQuestMutation.isPending}
                  >
                    {editingQuest ? 'Сохранить изменения' : 'Создать Квест'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByNPC).map(([npcName, questList], npcIdx) => (
            <motion.div
              key={npcName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: npcIdx * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    {npcName}
                    <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-400">
                      {questList.length} квестов
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questList.map((quest) => (
                      <div
                        key={quest.id}
                        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-amber-500/30 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-100 mb-1">{quest.title}</h4>
                            <p className="text-xs text-slate-400 font-mono">{quest.quest_id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getDifficultyColor(quest.difficulty)}>
                              {quest.difficulty}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(quest)}
                              className="text-slate-400 hover:text-amber-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="text-slate-300">{quest.description}</p>
                          
                          {quest.reward && (
                            <div className="flex items-center gap-2 text-green-400">
                              <Award className="w-4 h-4" />
                              <span className="text-xs">{quest.reward}</span>
                            </div>
                          )}

                          {quest.hints && quest.hints.length > 0 && (
                            <div className="pt-2 border-t border-slate-700/50">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <HelpCircle className="w-4 h-4" />
                                <span className="text-xs font-semibold">Подсказки: {quest.hints.length}</span>
                              </div>
                              <div className="text-xs text-slate-500 italic">
                                {quest.hints[0].substring(0, 60)}...
                              </div>
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

        {quests.length === 0 && !isLoading && (
          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl p-12">
            <div className="text-center text-slate-400">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Нет квестов</h3>
              <p>Создайте первый квест для выбранных NPC</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}