/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Deck, Card } from "../types";
import { Search, FolderSync, Plus, ArrowRight, Trash2, Sparkles, BookCheck, Wifi, WifiOff } from "lucide-react";

interface DeckManagerProps {
  decks: Deck[];
  cards: Card[];
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  onSelectPracticeDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onAddManualCard: (deckId: string, front: string, back: string, arFront: string, arBack: string, notes: string) => void;
  onCreateDeckManually: (title: string, desc: string) => void;
  syncPending: boolean;
  isFirebaseActive: boolean;
}

export default function DeckManager({
  decks,
  cards,
  selectedDeckId,
  onSelectDeck,
  onSelectPracticeDeck,
  onDeleteDeck,
  onAddManualCard,
  onCreateDeckManually,
  syncPending,
  isFirebaseActive
}: DeckManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [showAddDeckForm, setShowAddDeckForm] = useState(false);

  // Manual Card Creation states
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardArFront, setCardArFront] = useState("");
  const [cardArBack, setCardArBack] = useState("");
  const [cardNotes, setCardNotes] = useState("");
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;
    onCreateDeckManually(newDeckTitle.trim(), newDeckDesc.trim());
    setNewDeckTitle("");
    setNewDeckDesc("");
    setShowAddDeckForm(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !cardArFront.trim() || !cardArBack.trim()) return;
    onAddManualCard(
      selectedDeckId,
      cardArFront.trim(),
      cardArBack.trim(),
      cardArFront.trim(),
      cardArBack.trim(),
      cardNotes.trim()
    );
    setCardFront("");
    setCardBack("");
    setCardArFront("");
    setCardArBack("");
    setCardNotes("");
    setShowAddCardForm(false);
  };

  // Keyword filter that searches: Front, Back, Arabic translate, study notes!
  const filteredDecks = decks.filter(deck => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Check if deck matches query
    if (deck.title.toLowerCase().includes(query) || deck.description.toLowerCase().includes(query)) {
      return true;
    }

    // Check if any card inside this deck matches the query!
    const deckCards = cards.filter(c => c.deckId === deck.id);
    return deckCards.some(card => 
      card.front.toLowerCase().includes(query) || 
      card.back.toLowerCase().includes(query) ||
      card.arabicFront.toLowerCase().includes(query) ||
      card.arabicBack.toLowerCase().includes(query) ||
      (card.notes && card.notes.toLowerCase().includes(query))
    );
  });

  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const selectedDeckCards = cards.filter(c => c.deckId === selectedDeckId);

  // Spaced Repetition Due Count
  const getDueCount = (deckId: string) => {
    const now = new Date();
    return cards.filter(c => c.deckId === deckId && new Date(c.nextDue) <= now).length;
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D0F] p-4 rounded-2xl border border-white/5 shadow-xl" dir="rtl">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="بحث في المواد، الملاحظات الدراسية، والبطاقات التفاعلية أو المصطلحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs rounded-xl pr-9 pl-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 font-arabic text-right"
          />
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-3 shrink-0 mr-auto md:mr-0 pl-1">
          {isFirebaseActive ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-arabic px-3 py-1.5 rounded-xl">
              <Wifi className="w-3.5 h-3.5" /> الاتصال السحابي مفعّل
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-[11px] font-arabic px-3 py-1.5 rounded-xl">
              <WifiOff className="w-3.5 h-3.5" /> مخزن محلي آمن
            </div>
          )}

          {syncPending && (
            <span className="text-[11px] font-semibold text-amber-500 font-arabic animate-pulse flex items-center gap-1">
              <FolderSync className="w-3.5 h-3.5 animate-spin" />
              جاري الحفظ الدائم...
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Decks Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between" dir="rtl">
            <h2 className="text-sm font-arabic font-bold text-white flex items-center gap-2">
              <span>المجلدات والمواد الدراسية</span>
              <span className="text-xs text-white/40 font-sans tracking-wide">({filteredDecks.length})</span>
            </h2>
            <button
              onClick={() => setShowAddDeckForm(!showAddDeckForm)}
              className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all font-arabic font-semibold"
            >
              <Plus className="w-4 h-4" />
              أضف مادة دراسية
            </button>
          </div>

          {showAddDeckForm && (
            <form onSubmit={handleCreateDeck} className="bg-[#0D0D0F] p-4 border border-white/5 rounded-2xl space-y-3.5 shadow-xl text-right" dir="rtl">
              <div>
                <label className="block text-xs font-arabic font-semibold text-white/70 mb-1">اسم المادة الدراسية (المجلد)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علم الأحياء - الصف العاشر، بلاغة اللغة العربية"
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 text-white placeholder-white/20 font-arabic focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-arabic font-semibold text-white/70 mb-1">وصف المادة الدراسية / الترم</label>
                <input
                  type="text"
                  placeholder="مثال: مراجعة الفصل الثالث شاملة من الكتاب المدرسي"
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 text-white placeholder-white/20 font-arabic focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-arabic font-bold rounded-xl transition-all"
              >
                تأكيد وبدء تصنيف المادة
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {filteredDecks.length === 0 ? (
              <div className="text-center p-8 bg-[#0D0D0F] rounded-2xl border border-white/5 text-xs text-white/40 font-arabic" dir="rtl">
                لا توجد مواد دراسية حتى الآن. يرجى كتابة مادة في حقل التوليد بالذكاء الاصطناعي في الأعلى أو النقر على "أضف مادة جديدة" للبدء بالبناء يدوياً.
              </div>
            ) : (
              filteredDecks.map(deck => {
                const totalCardsCount = cards.filter(c => c.deckId === deck.id).length;
                const dueCount = getDueCount(deck.id);
                const isSelected = selectedDeckId === deck.id;

                return (
                  <div
                    key={deck.id}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all text-right ${
                      isSelected 
                        ? "bg-[#141419] border-amber-500/40 text-white shadow-lg" 
                        : "bg-[#0D0D0F] hover:bg-white/5 border-white/5 hover:border-white/10 text-white/90"
                    }`}
                    onClick={() => onSelectDeck(deck.id)}
                    dir="rtl"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="text-xs md:text-sm font-arabic font-bold text-amber-500 leading-tight">{deck.title}</h4>
                        <p className="text-[10px] md:text-xs font-arabic text-white/50 line-clamp-1 mt-1 leading-relaxed">{deck.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("هل أنت متأكد من رغبتك في حذف هذه المادة وجميع بطاقاتها؟")) {
                            onDeleteDeck(deck.id);
                          }
                        }}
                        className="p-1 px-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center transition-all cursor-pointer font-arabic font-bold"
                        title="حذف المادة بالكامل"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 font-arabic">
                      <span className="text-white/40 text-[10px] font-sans">{totalCardsCount} بطاقة دراسية</span>
                      {dueCount > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPracticeDeck(deck);
                          }}
                          className="flex items-center gap-1 text-emerald-400 font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px]"
                        >
                          حان موعد تكرارها ({dueCount}) <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      ) : (
                        <span className="text-white/20 text-[10px]">مكتمل بالكامل ✦</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Deck Details & Cards Column */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDeck ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D0F] p-5 rounded-2xl border border-white/5 text-right" dir="rtl">
                <div>
                  <h3 className="text-base font-arabic font-bold text-amber-500">{selectedDeck.title}</h3>
                  <p className="text-xs font-arabic text-white/50 mt-1">{selectedDeck.description}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => onSelectPracticeDeck(selectedDeck)}
                    className="flex flex-row-reverse items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-arabic font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <BookCheck className="w-4 h-4" />
                    <span>ابدأ مراجعة المادة</span>
                  </button>
                  <button
                    onClick={() => setShowAddCardForm(!showAddCardForm)}
                    className="flex flex-row-reverse items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-arabic font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة بطاقة يدوياً</span>
                  </button>
                </div>
              </div>

              {showAddCardForm && (
                <form onSubmit={handleAddCard} className="bg-[#0D0D0F] p-5 border border-white/5 rounded-3xl space-y-4 shadow-xl text-right" dir="rtl">
                  <p className="text-sm font-semibold text-white border-b border-white/5 pb-2 flex items-center justify-between">
                    <span className="text-[11px] text-amber-500 font-arabic font-bold" dir="rtl">
                      إضافة بطاقة مراجعة جديدة للمادة
                    </span>
                  </p>
                  
                  {/* Front Face: Arabic only */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-arabic font-bold text-amber-500">العنوان أو المصطلح (وجه البطاقة)</label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الميتوكوندريا"
                      value={cardArFront}
                      onChange={(e) => setCardArFront(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500/50 text-right font-arabic"
                      dir="rtl"
                    />
                  </div>

                  {/* Back Face: Arabic only */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-arabic font-bold text-amber-500">التعريف أو الجواب (خلف البطاقة)</label>
                    </div>
                    <textarea
                      required
                      placeholder="مثال: مصنع الطاقة في الخلية، ينتج أدينوسين ثلاثي الفوسفات."
                      value={cardArBack}
                      onChange={(e) => setCardArBack(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2.5 text-white h-20 resize-none focus:outline-none focus:border-amber-500/50 text-right font-arabic"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-arabic font-bold text-amber-500/80">تلميح أو ملاحظة لتسهيل المذاكرة متباعدة (اختياري)</label>
                    </div>
                    <input
                      type="text"
                      placeholder="مثال: ميتو = مصنع إنتاج الطاقة"
                      value={cardNotes}
                      onChange={(e) => setCardNotes(e.target.value)}
                      className="w-full bg-[#0D0D0F] border border-white/10 text-xs rounded-xl p-2.5 text-white text-right font-arabic focus:outline-none focus:border-amber-500/50"
                      dir="rtl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-arabic font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 text-center block"
                  >
                    حفظ وتأكيد إدراج البطاقة في المادة
                  </button>
                </form>
              )}

              {/* Cards list */}
              <div className="space-y-3">
                <h4 className="text-xs font-arabic font-bold text-white/40 tracking-wide text-right" dir="rtl">البطاقات المعرّفة بداخل المادة ({selectedDeckCards.length})</h4>
                {selectedDeckCards.length === 0 ? (
                  <div className="text-center p-8 bg-[#0D0D0F] border border-white/5 rounded-3xl text-sm font-arabic text-white/40 leading-relaxed" dir="rtl">
                    لا توجد بطاقات حتى الآن بداخل هذا القسم. يمكنك كتابة بطاقة يدوياً بالنقر على الزر بالإنشاء، أو توليدها في لحظات بالذكاء الاصطناعي في الاستمارة بالجهة المقابلة!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {selectedDeckCards.map(card => {
                      const isDue = new Date(card.nextDue) <= new Date();

                      return (
                        <div key={card.id} className="bg-[#0D0D0F] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch justify-between gap-4 text-xs transition-hover hover:border-white/10">
                          <div className="space-y-2.5 flex-1 text-right" dir="rtl">
                            <div>
                              <p className="text-base font-bold font-arabic text-amber-500 leading-normal" dir="rtl">{card.arabicFront || card.front}</p>
                            </div>
                            <div className="border-t border-white/5 pt-2 text-xs text-white/70">
                              <p className="text-xs md:text-sm font-bold font-arabic text-[#E4E4E7] leading-relaxed" dir="rtl">{card.arabicBack || card.back}</p>
                            </div>
                            {card.notes && (
                              <p className="text-[10px] text-white/40 italic flex items-center gap-1.5 font-arabic justify-start" dir="rtl">
                                💡 تلميح: {card.notes}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex sm:flex-col justify-between sm:justify-center items-end gap-1.5 font-mono text-[10px] bg-white/[0.02] border border-white/5 p-3 rounded-xl sm:w-44 text-right">
                            {isDue ? (
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-arabic font-bold text-[9px] leading-none mb-1">
                                حان موعد التكرار ⏰
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-full text-[9px] font-arabic">
                                مراجعة: {new Date(card.nextDue).toLocaleDateString("ar-SA")}
                              </span>
                            )}
                            <span className="text-white/40 font-arabic">مستوى الحفظ: <b className="text-amber-500 font-sans">{card.masteryLevel}/5</b></span>
                            <span className="text-white/30 font-arabic">الفترة: <b className="text-white/70 font-sans">{card.interval} يومًا</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0D0D0F] p-12 rounded-3xl border border-white/5 text-center text-xs text-white/40 h-96 flex flex-col justify-center items-center gap-2" dir="rtl">
              <Plus className="w-10 h-10 text-white/20 mb-2 cursor-pointer hover:scale-105 transition-all" onClick={() => setShowAddDeckForm(true)} />
              <p className="font-arabic font-bold text-amber-500 text-sm">لم يتم تحديد مادة دراسية</p>
              <p className="max-w-xs leading-relaxed font-arabic text-[11px] text-white/50 mt-1">
                الرجاء انتقاء مادة دراسية أو وحدة دراسية من القائمة بالجانب، للوصول لأسئلتها، وإمكانية تدوين وحفظ الفصول بداخلها.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
