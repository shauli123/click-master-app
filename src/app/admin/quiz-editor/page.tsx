"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  HelpCircle, 
  Image as ImageIcon, 
  BarChart3, 
  Trophy, 
  Settings,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import { SlideData, SlideType } from "@/types";

const STORAGE_KEY = "click_master_quiz_draft";

export default function QuizEditorPage() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [teams, setTeams] = useState<string[]>(["הנמרים", "הכרישים", "האריות"]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { slides: s, teams: t } = JSON.parse(saved);
        setSlides(s);
        setTeams(t);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ slides, teams }));
    }
  }, [slides, teams, isLoaded]);

  const addSlide = (type: SlideType) => {
    const newSlide: SlideData = {
      type,
      content: getPlaceholderContent(type),
    };

    if (type === "QUESTION" || type === "POLL") {
      newSlide.options = ["אופציה 1", "אופציה 2", "אופציה 3", "אופציה 4"];
      if (type === "QUESTION") {
        newSlide.correctOption = 0;
        newSlide.modifier = 1;
      }
    }

    if (type === "MEDIA") {
      newSlide.mediaUrl = "";
    }

    setSlides([...slides, newSlide]);
  };

  const getPlaceholderContent = (type: SlideType) => {
    switch (type) {
      case "TOPIC": return "נושא חדש";
      case "QUESTION": return "שאלה חדשה";
      case "MEDIA": return "כותרת למדיה";
      case "POLL": return "סקר חדש";
      case "LEADERBOARD": return "לוח תוצאות";
      case "PODIUM": return "פודיום סיום";
      default: return "";
    }
  };

  const updateSlide = (index: number, updates: Partial<SlideData>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
  };

  const updateOption = (slideIndex: number, optionIndex: number, value: string) => {
    const newSlides = [...slides];
    const slide = { ...newSlides[slideIndex] };
    if (slide.options) {
      const newOptions = [...slide.options];
      newOptions[optionIndex] = value;
      slide.options = newOptions;
      newSlides[slideIndex] = slide;
      setSlides(newSlides);
    }
  };

  const deleteSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === slides.length - 1) return;

    const newSlides = [...slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    setSlides(newSlides);
  };

  const exportCSV = () => {
    const rows = [];
    
    // Settings row
    rows.push({
      Type: "SETTINGS",
      Content: `קבוצות: ${teams.join(",")}`,
      "Option A": "", "Option B": "", "Option C": "", "Option D": "",
      Correct: "", Modifier: "", "URL/Media": ""
    });

    // Slide rows
    slides.forEach(slide => {
      rows.push({
        Type: slide.type,
        Content: slide.content,
        "Option A": slide.options?.[0] || "",
        "Option B": slide.options?.[1] || "",
        "Option C": slide.options?.[2] || "",
        "Option D": slide.options?.[3] || "",
        Correct: slide.correctOption !== undefined ? slide.correctOption + 1 : "",
        Modifier: slide.modifier ? `J${slide.modifier}` : "",
        "URL/Media": slide.mediaUrl || ""
      });
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "quiz_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const rows = results.data as any[];
          const newSlides: SlideData[] = [];
          let newTeams: string[] = teams;

          rows.forEach(row => {
            const type = (row["Type"] || "").toUpperCase().trim();
            const content = (row["Content"] || "").trim();

            if (type === "SETTINGS") {
              if (content.startsWith("קבוצות:")) {
                newTeams = content.replace("קבוצות:", "").split(",").map((s: string) => s.trim());
              }
              return;
            }

            if (!type) return;

            const slide: SlideData = {
              type: type as SlideType,
              content
            };

            if (type === "QUESTION" || type === "POLL") {
              slide.options = [
                row["Option A"] || "",
                row["Option B"] || "",
                row["Option C"] || "",
                row["Option D"] || ""
              ].filter(Boolean);

              if (type === "QUESTION") {
                const correct = parseInt(row["Correct"], 10);
                if (!isNaN(correct)) slide.correctOption = correct - 1;

                const mod = row["Modifier"] || "";
                if (mod.startsWith("J")) {
                  slide.modifier = parseInt(mod.substring(1), 10);
                }
              }
            }

            if (type === "MEDIA") {
              slide.mediaUrl = row["URL/Media"] || "";
            }

            newSlides.push(slide);
          });

          setSlides(newSlides);
          setTeams(newTeams);
        }
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="h-20 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
            עורך חידונים
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-zinc-700 transition-colors">
            <Upload size={18} />
            <span className="font-bold">ייבוא CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
          <button 
            onClick={exportCSV}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <Download size={18} />
            ייצוא CSV
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar (Slide Types) */}
        <aside className="w-64 bg-zinc-900/50 border-l border-zinc-800 p-6 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">הוספת שקופית</h2>
          <button onClick={() => addSlide("TOPIC")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <FileText size={20} className="text-blue-400" />
            <span className="font-bold">נושא / כותרת</span>
          </button>
          <button onClick={() => addSlide("QUESTION")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <HelpCircle size={20} className="text-amber-400" />
            <span className="font-bold">שאלה אמריקאית</span>
          </button>
          <button onClick={() => addSlide("MEDIA")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <ImageIcon size={20} className="text-fuchsia-400" />
            <span className="font-bold">תמונה / וידאו</span>
          </button>
          <button onClick={() => addSlide("POLL")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <BarChart3 size={20} className="text-emerald-400" />
            <span className="font-bold">סקר קהל</span>
          </button>
          <button onClick={() => addSlide("LEADERBOARD")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <Trophy size={20} className="text-indigo-400" />
            <span className="font-bold">לוח תוצאות</span>
          </button>
          <button onClick={() => addSlide("PODIUM")} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-right">
            <Settings size={20} className="text-rose-400" />
            <span className="font-bold">פודיום סיום</span>
          </button>

          <div className="mt-8">
            <h2 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">הגדרות קבוצות</h2>
            <div className="flex flex-col gap-2">
              {teams.map((team, i) => (
                <input
                  key={i}
                  value={team}
                  onChange={(e) => {
                    const newTeams = [...teams];
                    newTeams[i] = e.target.value;
                    setTeams(newTeams);
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              ))}
              <button 
                onClick={() => setTeams([...teams, `קבוצה ${teams.length + 1}`])}
                className="text-xs text-blue-400 font-bold hover:underline mt-2 text-right"
              >
                + הוסף קבוצה
              </button>
            </div>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-zinc-950">
          <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-20">
            <AnimatePresence mode="popLayout">
              {slides.map((slide, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900 rounded-[2rem] border border-zinc-800 p-8 relative group"
                >
                  {/* Slide Header Controls */}
                  <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveSlide(index, "up")} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"><ChevronUp size={20} /></button>
                    <button onClick={() => moveSlide(index, "down")} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"><ChevronDown size={20} /></button>
                    <button onClick={() => deleteSlide(index)} className="p-2 bg-red-950/50 text-red-500 rounded-lg hover:bg-red-900/50 mt-4"><Trash2 size={20} /></button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      slide.type === "QUESTION" ? "bg-amber-500/20 text-amber-500" :
                      slide.type === "TOPIC" ? "bg-blue-500/20 text-blue-500" :
                      slide.type === "MEDIA" ? "bg-fuchsia-500/20 text-fuchsia-500" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">{slide.type}</span>
                      <h3 className="font-bold text-xl">שקופית {index + 1}</h3>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">תוכן השקופית / שאלה</label>
                      <input
                        value={slide.content}
                        onChange={(e) => updateSlide(index, { content: e.target.value })}
                        className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-blue-500 rounded-2xl px-6 py-4 text-xl outline-none transition-all"
                        placeholder="הכנס תוכן כאן..."
                      />
                    </div>

                    {(slide.type === "QUESTION" || slide.type === "POLL") && (
                      <div className="grid grid-cols-2 gap-4">
                        {slide.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="relative">
                            <label className="block text-xs font-bold text-zinc-500 mb-1 px-2">תשובה {["א'", "ב'", "ג'", "ד'"][optIdx]}</label>
                            <input
                              value={opt}
                              onChange={(e) => updateOption(index, optIdx, e.target.value)}
                              className={`w-full bg-zinc-800 border-2 rounded-xl px-4 py-3 outline-none transition-all ${
                                slide.type === "QUESTION" && slide.correctOption === optIdx 
                                ? "border-green-500 bg-green-500/5" 
                                : "border-zinc-700 focus:border-zinc-600"
                              }`}
                            />
                            {slide.type === "QUESTION" && (
                              <button
                                onClick={() => updateSlide(index, { correctOption: optIdx })}
                                className={`absolute left-3 top-9 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  slide.correctOption === optIdx 
                                  ? "bg-green-500 border-green-500 text-zinc-950" 
                                  : "border-zinc-600 hover:border-zinc-500"
                                }`}
                              >
                                {slide.correctOption === optIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {slide.type === "QUESTION" && (
                      <div className="flex items-center gap-6 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 mb-1">מכפיל (J1-J3)</label>
                          <select 
                            value={slide.modifier || 1}
                            onChange={(e) => updateSlide(index, { modifier: parseInt(e.target.value) })}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-1 font-bold outline-none"
                          >
                            <option value="1">J1 (רגיל)</option>
                            <option value="2">J2 (כפול)</option>
                            <option value="3">J3 (משולש)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {slide.type === "MEDIA" && (
                      <div>
                        <label className="block text-sm font-bold text-zinc-400 mb-2">קישור למדיה (URL)</label>
                        <input
                          value={slide.mediaUrl || ""}
                          onChange={(e) => updateSlide(index, { mediaUrl: e.target.value })}
                          className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-fuchsia-500 rounded-2xl px-6 py-4 outline-none transition-all font-mono text-sm"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {slides.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                <FileText size={64} className="text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold text-xl">החידון שלך ריק. הוסף שקופית מהתפריט בצד!</p>
              </div>
            )}
            
            <button 
              onClick={() => addSlide("QUESTION")}
              className="w-full py-8 border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-500 font-black text-2xl hover:bg-zinc-900/50 hover:border-zinc-700 transition-all flex items-center justify-center gap-4"
            >
              <Plus size={32} />
              הוסף שקופית חדשה
            </button>
          </div>
        </main>
      </div>

      {/* Auto-save indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        השינויים נשמרים אוטומטית באופן מקומי
      </div>
    </div>
  );
}
