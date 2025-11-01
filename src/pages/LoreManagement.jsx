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
import { Plus, Book, CheckCircle, Clock, Edit } from "lucide-react";
import { motion } from "framer-motion";

export default function LoreManagementPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLore, setEditingLore] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    world_name: "",
    version: "1.0",
    content: "",
    factions: "",
    magic_tech: "",
    laws_taboos: "",
    canon_rules: ""
  });

  const { data: loreItems, isLoading } = useQuery({
    queryKey: ['lore'],
    queryFn: () => base44.entities.Lore.list('-created_date'),
    initialData: [],
  });

  const createLoreMutation = useMutation({
    mutationFn: (data) => base44.entities.Lore.create({
      ...data,
      factions: data.factions.split(',').map(f => f.trim()).filter(Boolean),
      laws_taboos: data.laws_taboos.split(',').map(l => l.trim()).filter(Boolean),
      canon_rules: data.canon_rules.split(',').map(c => c.trim()).filter(Boolean),
      indexed: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lore'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateLoreMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lore.update(id, {
      ...data,
      factions: data.factions.split(',').map(f => f.trim()).filter(Boolean),
      laws_taboos: data.laws_taboos.split(',').map(l => l.trim()).filter(Boolean),
      canon_rules: data.canon_rules.split(',').map(c => c.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lore'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      world_name: "",
      version: "1.0",
      content: "",
      factions: "",
      magic_tech: "",
      laws_taboos: "",
      canon_rules: ""
    });
    setEditingLore(null);
  };

  const handleEdit = (lore) => {
    setEditingLore(lore);
    setFormData({
      world_name: lore.world_name,
      version: lore.version || "1.0",
      content: lore.content,
      factions: lore.factions?.join(', ') || "",
      magic_tech: lore.magic_tech || "",
      laws_taboos: lore.laws_taboos?.join(', ') || "",
      canon_rules: lore.canon_rules?.join(', ') || ""
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingLore) {
      updateLoreMutation.mutate({ id: editingLore.id, data: formData });
    } else {
      createLoreMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Управление Лором
            </h1>
            <p className="text-slate-400 mt-1">Создание и редактирование лора мира</p>
          </div>
          
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Добавить Лор
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-slate-900 border-indigo-900/30 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingLore ? 'Редактировать Лор' : 'Новый Лор'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="world_name" className="text-slate-300">Название мира</Label>
                    <Input
                      id="world_name"
                      value={formData.world_name}
                      onChange={(e) => setFormData({...formData, world_name: e.target.value})}
                      placeholder="Терры Западной Заставы"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version" className="text-slate-300">Версия</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      placeholder="1.0"
                      className="bg-slate-800/50 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="factions" className="text-slate-300">Фракции (через запятую)</Label>
                  <Input
                    id="factions"
                    value={formData.factions}
                    onChange={(e) => setFormData({...formData, factions: e.target.value})}
                    placeholder="Сторожа, Клан Вороньих, Гильдия Кузнецов"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="magic_tech" className="text-slate-300">Магия и технологии</Label>
                  <Input
                    id="magic_tech"
                    value={formData.magic_tech}
                    onChange={(e) => setFormData({...formData, magic_tech: e.target.value})}
                    placeholder="низкая магия, ремесленные артефакты"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="laws_taboos" className="text-slate-300">Законы и табу (через запятую)</Label>
                  <Input
                    id="laws_taboos"
                    value={formData.laws_taboos}
                    onChange={(e) => setFormData({...formData, laws_taboos: e.target.value})}
                    placeholder="не лгать старейшинам, ночной комендантский час"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="canon_rules" className="text-slate-300">Канонические правила (через запятую)</Label>
                  <Input
                    id="canon_rules"
                    value={formData.canon_rules}
                    onChange={(e) => setFormData({...formData, canon_rules: e.target.value})}
                    placeholder="Стражи не берут взятки и не врут"
                    className="bg-slate-800/50 border-slate-700 text-slate-100"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-slate-300">Полный контент (YAML/JSON)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Введите полный лор в формате YAML или JSON..."
                    className="bg-slate-800/50 border-slate-700 text-slate-100 font-mono text-sm h-64"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  disabled={createLoreMutation.isPending || updateLoreMutation.isPending}
                >
                  {editingLore ? 'Сохранить изменения' : 'Создать Лор'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loreItems.map((lore, idx) => (
            <motion.div
              key={lore.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl hover:border-violet-500/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                        <Book className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-slate-100">{lore.world_name}</CardTitle>
                        <p className="text-sm text-slate-400">Версия {lore.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={lore.indexed 
                          ? "border-green-500/30 text-green-400" 
                          : "border-amber-500/30 text-amber-400"
                        }
                      >
                        {lore.indexed ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Проиндексирован</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Ожидает индексации</>
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(lore)}
                        className="border-indigo-900/30 text-slate-300 hover:bg-indigo-900/20"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lore.magic_tech && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">Магия и технологии:</p>
                      <p className="text-sm text-slate-400">{lore.magic_tech}</p>
                    </div>
                  )}

                  {lore.factions && lore.factions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-2">Фракции:</p>
                      <div className="flex flex-wrap gap-2">
                        {lore.factions.map((faction, i) => (
                          <Badge key={i} variant="outline" className="border-violet-500/30 text-violet-400">
                            {faction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lore.laws_taboos && lore.laws_taboos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">Законы и табу:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                        {lore.laws_taboos.slice(0, 3).map((law, i) => (
                          <li key={i}>{law}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lore.content && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">Контент:</p>
                      <div className="bg-slate-950/50 rounded-lg p-3 text-xs font-mono text-slate-400 max-h-32 overflow-y-auto">
                        {lore.content.substring(0, 300)}...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {loreItems.length === 0 && !isLoading && (
          <Card className="bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl p-12">
            <div className="text-center text-slate-400">
              <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Нет лора</h3>
              <p>Добавьте первый лор для начала работы</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}