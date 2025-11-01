import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, User, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function NPCManagementPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNPC, setEditingNPC] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    npc_id: "",
    name: "",
    role: "",
    sheet_content: "",
    temperament: "",
    speech_markers: "",
    goals: "",
    active: true
  });

  const { data: npcs, isLoading } = useQuery({
    queryKey: ['npcs'],
    queryFn: () => base44.entities.NPC.list('-created_date'),
    initialData: [],
  });

  const createNPCMutation = useMutation({
    mutationFn: (data) => base44.entities.NPC.create({
      ...data,
      temperament: data.temperament.split(',').map(t => t.trim()).filter(Boolean),
      speech_markers: data.speech_markers.split(',').map(s => s.trim()).filter(Boolean),
      goals: data.goals.split(',').map(g => g.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateNPCMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NPC.update(id, {
      ...data,
      temperament: data.temperament.split(',').map(t => t.trim()).filter(Boolean),
      speech_markers: data.speech_markers.split(',').map(s => s.trim()).filter(Boolean),
      goals: data.goals.split(',').map(g => g.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.NPC.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs'] });
    },
  });

  const resetForm = () => {
    setFormData({
      npc_id: "",
      name: "",
      role: "",
      sheet_content: "",
      temperament: "",
      speech_markers: "",
      goals: "",
      active: true
    });
    setEditingNPC(null);
  };

  const handleEdit = (npc) => {
    setEditingNPC(npc);
    setFormData({
      npc_id: npc.npc_id,
      name: npc.name,
      role: npc.role,
      sheet_content: npc.sheet_content,
      temperament: npc.temperament?.join(', ') || "",
      speech_markers: npc.speech_markers?.join(', ') || "",
      goals: npc.goals?.join(', ') || "",
      active: npc.active
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingNPC) {
      updateNPCMutation.mutate({ id: editingNPC.id, data: formData });
    } else {
      createNPCMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Управление NPC
            </h1>
            <p className="text-slate-400 mt-1">Создание и редактирование персонажей</p>
          </div>
          
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Создать NPC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-indigo-900/30 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingNPC ? 'Редактировать NPC' : 'Новый NPC'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="npc_id" className="text-slate-300">ID персонажа</Label>
                    <Input
                      id="npc_id"
                      value={formData.npc_id}
                      onChange={(e) => setFormData({...formData, npc_id: e.target.value})}
                      placeholder="npc_guard_01"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name" className="text-slate-300">Имя</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Буревестник"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role" className="text-slate-300">Роль</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="Сторож западной заставы"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="temperament" className="text-slate-300">Характер (через запятую)</Label>
                  <Input
                    id="temperament"
                    value={formData.temperament}
                    onChange={(e) => setFormData({...formData, temperament: e.target.value})}
                    placeholder="хмурый, прямой, недоверчивый"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="speech_markers" className="text-slate-300">Речевые маркеры (через запятую)</Label>
                  <Input
                    id="speech_markers"
                    value={formData.speech_markers}
                    onChange={(e) => setFormData({...formData, speech_markers: e.target.value})}
                    placeholder="чужак, без торга, короткие фразы"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="goals" className="text-slate-300">Цели (через запятую)</Label>
                  <Input
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData({...formData, goals: e.target.value})}
                    placeholder="охранять тракт, сдерживать клан Вороньих"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="sheet_content" className="text-slate-300">Полная карточка (YAML)</Label>
                  <Textarea
                    id="sheet_content"
                    value={formData.sheet_content}
                    onChange={(e) => setFormData({...formData, sheet_content: e.target.value})}
                    placeholder="Введите полную карточку NPC в формате YAML..."
                    className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono text-sm h-48"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  disabled={createNPCMutation.isPending || updateNPCMutation.isPending}
                >
                  {editingNPC ? 'Сохранить изменения' : 'Создать NPC'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {npcs.map((npc, idx) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl hover:border-violet-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-100">{npc.name}</CardTitle>
                        <p className="text-sm text-slate-400">{npc.role}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActiveMutation.mutate({ id: npc.id, active: !npc.active })}
                      className={npc.active ? 'text-green-400' : 'text-slate-500'}
                    >
                      {npc.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {npc.temperament && npc.temperament.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {npc.temperament.map((trait, i) => (
                        <Badge key={i} variant="outline" className="border-violet-500/30 text-violet-400 text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {npc.goals && npc.goals.length > 0 && (
                    <div className="text-sm text-slate-400">
                      <p className="font-semibold text-slate-300 mb-1">Цели:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {npc.goals.slice(0, 2).map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(npc)}
                      className="flex-1 border-indigo-900/30 text-slate-300 hover:bg-indigo-900/20"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500">ID: {npc.npc_id}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {npcs.length === 0 && !isLoading && (
          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl p-12">
            <div className="text-center text-slate-400">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Нет NPC</h3>
              <p>Создайте первого персонажа для начала работы</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}