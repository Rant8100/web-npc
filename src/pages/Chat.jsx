import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, User, Bot, Sparkles, Clock, Target, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ChatPage() {
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: npcs, isLoading: npcsLoading } = useQuery({
    queryKey: ['npcs'],
    queryFn: () => base44.entities.NPC.filter({ active: true }),
    initialData: [],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedNPC?.id, user?.id],
    queryFn: () => base44.entities.ChatMessage.filter({
      npc_id: selectedNPC?.id,
      player_id: user?.id
    }, '-created_date', 50),
    initialData: [],
    enabled: !!selectedNPC && !!user,
  });

  const { data: memory } = useQuery({
    queryKey: ['memory', selectedNPC?.id, user?.id],
    queryFn: () => base44.entities.DialogMemory.filter({
      npc_id: selectedNPC?.id,
      player_id: user?.id
    }),
    initialData: [],
    enabled: !!selectedNPC && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ playerMsg, npcId }) => {
      await base44.entities.ChatMessage.create({
        player_id: user.id,
        npc_id: npcId,
        message: playerMsg,
        sender: 'player',
        timestamp: new Date().toISOString()
      });

      const response = await processNPCResponse(playerMsg, npcId);
      
      await base44.entities.ChatMessage.create({
        player_id: user.id,
        npc_id: npcId,
        message: response.reply,
        sender: 'npc',
        intent_matched: response.intent,
        used_canon: response.usedCanon,
        timestamp: new Date().toISOString()
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['memory'] });
    },
  });

  const processNPCResponse = async (playerMessage, npcId) => {
    const canonAnswers = await base44.entities.CanonAnswer.filter({ npc_id: npcId });
    
    const matchedIntent = findIntentMatch(playerMessage, canonAnswers);
    
    if (matchedIntent) {
      return {
        reply: matchedIntent.reply,
        intent: matchedIntent.intent,
        usedCanon: true
      };
    }

    const npc = npcs.find(n => n.id === npcId);
    const contextPrompt = buildContextPrompt(npc, playerMessage, memory[0]);
    
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
    });

    return {
      reply: llmResponse,
      intent: null,
      usedCanon: false
    };
  };

  const findIntentMatch = (message, canonAnswers) => {
    const lowerMessage = message.toLowerCase().trim();
    
    for (const canon of canonAnswers) {
      for (const pattern of canon.pattern_examples || []) {
        if (lowerMessage.includes(pattern.toLowerCase()) || 
            pattern.toLowerCase().includes(lowerMessage)) {
          return canon;
        }
      }
    }
    return null;
  };

  const buildContextPrompt = (npc, playerMessage, memoryData) => {
    return `Ты — NPC "${npc.name}" (${npc.role}). 

КАРТОЧКА ПЕРСОНАЖА:
${npc.sheet_content}

РЕЧЕВЫЕ МАРКЕРЫ: ${npc.speech_markers?.join(', ')}
ХАРАКТЕР: ${npc.temperament?.join(', ')}

${memoryData ? `ПАМЯТЬ О ИГРОКЕ: ${JSON.stringify(memoryData.facts || [])}` : ''}

ВАЖНО:
- Отвечай ТОЛЬКО от лица персонажа, в его стиле
- НЕ упоминай современный мир, интернет, технологии
- Ответ должен быть коротким (1-3 абзаца)
- Следуй характеру и манерам персонажа

Сообщение игрока: "${playerMessage}"

Ответь от лица ${npc.name}:`;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedNPC || isProcessing) return;

    setIsProcessing(true);
    try {
      await sendMessageMutation.mutateAsync({
        playerMsg: message,
        npcId: selectedNPC.id
      });
      setMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentMemory = memory[0];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="border-b border-indigo-900/30 bg-slate-950/30 backdrop-blur-xl p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Диалог с NPC
              </h1>
              <p className="text-slate-400 mt-1">Выберите персонажа для начала беседы</p>
            </div>
            
            <Select
              value={selectedNPC?.id}
              onValueChange={(value) => setSelectedNPC(npcs.find(n => n.id === value))}
            >
              <SelectTrigger className="w-64 bg-slate-900/50 border-indigo-900/30 text-slate-200">
                <SelectValue placeholder="Выберите NPC" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-indigo-900/30">
                {npcs.map((npc) => (
                  <SelectItem key={npc.id} value={npc.id} className="text-slate-200">
                    {npc.name} — {npc.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex max-w-7xl w-full mx-auto gap-6 p-6">
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!selectedNPC ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Выберите NPC для начала диалога</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Начните беседу с {selectedNPC.name}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {[...messages].reverse().map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex gap-3 ${msg.sender === 'player' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'player' 
                          ? 'bg-gradient-to-br from-blue-600 to-cyan-600' 
                          : 'bg-gradient-to-br from-violet-600 to-indigo-600'
                      } shadow-lg`}>
                        {msg.sender === 'player' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-2xl ${msg.sender === 'player' ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.sender === 'player'
                            ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-800/30'
                            : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/30'
                        }`}>
                          <p className="text-slate-100 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-2">
                          {msg.used_canon && (
                            <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Канон
                            </Badge>
                          )}
                          {msg.intent_matched && (
                            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400">
                              {msg.intent_matched}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {msg.created_date && format(new Date(msg.created_date), 'HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedNPC && (
              <div className="border-t border-indigo-900/30 p-4 bg-slate-950/30">
                <div className="flex gap-3">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Введите сообщение..."
                    className="flex-1 bg-slate-900/50 border-indigo-900/30 text-slate-200 resize-none"
                    rows={2}
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isProcessing}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-full px-6"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {selectedNPC && (
          <Card className="w-80 bg-slate-900/50 border-indigo-900/30 backdrop-blur-xl p-6 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{selectedNPC.name}</h3>
                  <p className="text-sm text-slate-400">{selectedNPC.role}</p>
                </div>
              </div>
              
              {selectedNPC.temperament && selectedNPC.temperament.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNPC.temperament.map((trait, idx) => (
                    <Badge key={idx} variant="outline" className="border-violet-500/30 text-violet-400">
                      {trait}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {currentMemory && (
              <>
                <div className="border-t border-indigo-900/30 pt-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Репутация
                  </h4>
                  {currentMemory.reputation && Object.keys(currentMemory.reputation).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(currentMemory.reputation).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">{key}</span>
                          <span className={`font-semibold ${
                            value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Нейтральная репутация</p>
                  )}
                </div>

                {currentMemory.quest_states && Object.keys(currentMemory.quest_states).length > 0 && (
                  <div className="border-t border-indigo-900/30 pt-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      Квесты
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(currentMemory.quest_states).map(([questId, questData]) => (
                        <div key={questId} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-300">{questId}</span>
                            <Badge variant="outline" className={`text-xs ${
                              questData.status === 'completed' ? 'border-green-500/30 text-green-400' :
                              questData.status === 'in_progress' ? 'border-amber-500/30 text-amber-400' :
                              questData.status === 'failed' ? 'border-red-500/30 text-red-400' :
                              'border-slate-500/30 text-slate-400'
                            }`}>
                              {questData.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentMemory.current_emotion && (
                  <div className="border-t border-indigo-900/30 pt-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Настроение</h4>
                    <Badge className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 text-violet-300">
                      {currentMemory.current_emotion}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}