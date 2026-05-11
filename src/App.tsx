/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Layout, 
  Table as TableIcon, 
  DatabaseZap, 
  Search, 
  FileText, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Code,
  FileJson,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectStep, DatabaseProject, Table } from './types';
import { GoogleGenAI } from "@google/genai";

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick, 
  isCompleted 
}: { 
  icon: any, 
  label: string, 
  isActive: boolean, 
  onClick: () => void,
  isCompleted: boolean,
  key?: string
}) => (
  <button
    id={`step-${label.toLowerCase().replace(/\s/g, '-')}`}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 border-2 transition-all duration-200 group ${
      isActive 
        ? 'bg-slate-900 text-white border-slate-900 font-black' 
        : 'hover:bg-slate-50 text-slate-600 border-transparent'
    }`}
  >
    <div className={`p-1 flex items-center justify-center border ${isActive ? 'border-white/20' : 'border-slate-200 group-hover:border-slate-900'}`}>
      <Icon size={16} />
    </div>
    <span className="text-xs uppercase tracking-widest flex-1 text-left">{label}</span>
    {isCompleted && !isActive && <CheckCircle2 size={14} className="text-rose-600" />}
  </button>
);

export default function App() {
  const [currentStep, setCurrentStep] = useState<ProjectStep>(ProjectStep.INTRO);
  const [project, setProject] = useState<DatabaseProject>({
    title: '',
    problemStatement: '',
    entities: [],
    queries: [
      { id: 'join', label: 'Minimum 2 złączenia (JOIN)', description: 'Złączenia z co najmniej dwiema tabelami.', sql: '', isMet: false },
      { id: 'group', label: 'Grupowanie (GROUP BY)', description: 'Funkcja agregująca (COUNT, AVG, itp.).', sql: '', isMet: false },
      { id: 'having', label: 'HAVING lub Podzapytanie', description: 'Filtrowanie grup lub zapytanie w zapytaniu.', sql: '', isMet: false },
      { id: 'where', label: 'Filtrowanie (WHERE)', description: 'Standardowe filtrowanie wierszy.', sql: '', isMet: false },
      { id: 'order', label: 'Porządkowanie (ORDER BY)', description: 'Sortowanie wyników.', sql: '', isMet: false }
    ],
    hasView: true,
    viewDetails: {
      name: 'raport_podsumowanie',
      sql: '',
      purpose: 'Główny widok analityczny dla menedżera systemu.'
    }
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const steps = [
    { id: ProjectStep.INTRO, label: 'Wprowadzenie', icon: BookOpen },
    { id: ProjectStep.CONCEPT, label: 'Koncepcja', icon: Sparkles },
    { id: ProjectStep.SCHEMA, label: 'Schemat', icon: TableIcon },
    { id: ProjectStep.DATA, label: 'Dane', icon: DatabaseZap },
    { id: ProjectStep.QUERIES, label: 'Zapytania (SQL)', icon: Search },
    { id: ProjectStep.ADVANCED, label: 'Zaawansowane', icon: Layout },
    { id: ProjectStep.EXPORT, label: 'Eksport (Colab)', icon: Download },
  ];

  const canProgress = useMemo(() => {
    switch (currentStep) {
      case ProjectStep.INTRO: return true;
      case ProjectStep.CONCEPT: return project.title.length > 5 && project.problemStatement.length > 20;
      case ProjectStep.SCHEMA: return project.entities.length >= 4;
      default: return true;
    }
  }, [project, currentStep]);

  const loadTemplate = () => {
    setProject({
      title: 'System Wolontariatu NGO',
      problemStatement: 'Projekt polega na zaprojektowaniu bazy danych wspierającej lokalne organizacje pozarządowe w zarządzaniu projektami społecznymi oraz przypisywaniu do nich wolontariuszy. Celem bazy jest śledzenie zaangażowania (godzin pracy) oraz ról pełnionych przez uczestników w różnych inicjatywach miejskich.',
      entities: [
        {
          id: 't-org', name: 'organizacje', description: 'Rejestr organizacji partnerskich.',
          columns: [
            { id: 'c1', name: 'org_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
            { id: 'c2', name: 'nazwa', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: true },
            { id: 'c3', name: 'miasto', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: false }
          ],
          rows: [
            { org_id: 1, nazwa: 'Fundacja Pomocna Dłoń', miasto: 'Zielona Góra' },
            { org_id: 2, nazwa: 'Stowarzyszenie Aktywni', miasto: 'Poznań' }
          ]
        },
        {
          id: 't-wol', name: 'wolontariusze', description: 'Dane osobowe wolontariuszy.',
          columns: [
            { id: 'c4', name: 'wolontariusz_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
            { id: 'c5', name: 'imie', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c6', name: 'nazwisko', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c7', name: 'email', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: true }
          ],
          rows: [
            { wolontariusz_id: 1, imie: 'Anna', nazwisko: 'Kowalska', email: 'anna@example.com' },
            { wolontariusz_id: 2, imie: 'Jan', nazwisko: 'Nowak', email: 'jan@example.com' }
          ]
        },
        {
          id: 't-prj', name: 'projekty', description: 'Projekty realizowane przez organizacje.',
          columns: [
            { id: 'c8', name: 'projekt_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
            { id: 'c9', name: 'org_id', type: 'INTEGER', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c10', name: 'nazwa', type: 'TEXT', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c11', name: 'budzet', type: 'REAL', isPrimaryKey: false, isNullable: true, isUnique: false }
          ],
          rows: [
            { projekt_id: 1, org_id: 1, nazwa: 'Warsztaty Cyfrowe', budzet: 5000 },
            { projekt_id: 2, org_id: 2, nazwa: 'Zielona Szkoła', budzet: 8000 }
          ]
        },
        {
          id: 't-ucz', name: 'uczestnictwo', description: 'Tabela łącząca (M:N) - udział w projektach.',
          columns: [
            { id: 'c12', name: 'uczestnictwo_id', type: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true },
            { id: 'c13', name: 'projekt_id', type: 'INTEGER', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c14', name: 'wolontariusz_id', type: 'INTEGER', isPrimaryKey: false, isNullable: false, isUnique: false },
            { id: 'c15', name: 'rola', type: 'TEXT', isPrimaryKey: false, isNullable: true, isUnique: false },
            { id: 'c16', name: 'godziny', type: 'INTEGER', isPrimaryKey: false, isNullable: true, isUnique: false }
          ],
          rows: [
            { uczestnictwo_id: 1, projekt_id: 1, wolontariusz_id: 1, rola: 'koordynator', godziny: 40 },
            { uczestnictwo_id: 2, projekt_id: 1, wolontariusz_id: 2, rola: 'pomocnik', godziny: 15 },
            { uczestnictwo_id: 3, projekt_id: 2, wolontariusz_id: 1, rola: 'pomocnik', godziny: 10 }
          ]
        }
      ],
      queries: [
        { id: 'join', label: 'Minimum 2 złączenia (JOIN)', description: 'Sprawdza, które projekty miały najwięcej godzin.', sql: 'SELECT p.nazwa, SUM(u.godziny) as total_h \nFROM projekty p \nJOIN uczestnictwo u ON p.projekt_id = u.projekt_id\nGROUP BY p.nazwa\nORDER BY total_h DESC;', isMet: true },
        { id: 'group', label: 'Grupowanie (GROUP BY)', description: 'Liczba wolontariuszy w miastach.', sql: 'SELECT miasto, COUNT(*) as liczba_org\nFROM organizacje\nGROUP BY miasto;', isMet: true },
        { id: 'having', label: 'HAVING lub Podzapytanie', description: 'Wolontariusze z h > 20.', sql: 'SELECT wolontariusz_id, SUM(godziny) as h\nFROM uczestnictwo\nGROUP BY wolontariusz_id\nHAVING h > 20;', isMet: true },
        { id: 'where', label: 'Filtrowanie (WHERE)', description: 'Projekty z budżetem > 5k.', sql: 'SELECT * FROM projekty WHERE budzet > 5000;', isMet: true },
        { id: 'order', label: 'Porządkowanie (ORDER BY)', description: 'Lista wolontariuszy alfabetycznie.', sql: 'SELECT * FROM wolontariusze ORDER BY nazwisko ASC;', isMet: true }
      ],
      hasView: true,
      viewDetails: {
        name: 'v_raport_projektow',
        sql: 'CREATE VIEW v_raport_projektow AS\nSELECT o.nazwa as org, p.nazwa as prj, w.imie || \' \' || w.nazwisko as wol, u.rola, u.godziny\nFROM uczestnictwo u\nJOIN projekty p ON u.projekt_id = p.projekt_id\nJOIN organizacje o ON p.org_id = o.org_id\nJOIN wolontariusze w ON u.wolontariusz_id = w.wolontariusz_id;',
        purpose: 'Pełny raport zaangażowania wolontariuszy.'
      }
    });
    setCurrentStep(ProjectStep.SCHEMA);
  };

  const handleAiAssist = () => {
    // Disabled logic
  };

  const getSqlExport = () => {
    let sql = `-- Projekt końcowy: ${project.title || 'Bez tytułu'}\nPRAGMA foreign_keys = ON;\n\n`;
    project.entities.forEach(table => {
      sql += `-- Tabela: ${table.name}\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
      const colDefs = table.columns.map(col => {
        let def = `  ${col.name} ${col.type}`;
        if (col.isPrimaryKey) def += ` PRIMARY KEY`;
        if (col.isUnique) def += ` UNIQUE`;
        return def;
      });
      sql += colDefs.join(',\n');
      sql += `\n);\n\n`;

      if (table.rows && table.rows.length > 0) {
        sql += `-- Dane dla ${table.name}\n`;
        table.rows.forEach(row => {
          const keys = Object.keys(row);
          const values = keys.map(k => {
            const val = row[k];
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (val === null) return 'NULL';
            return val;
          });
          sql += `INSERT INTO ${table.name} (${keys.join(', ')}) VALUES (${values.join(', ')});\n`;
        });
        sql += `\n`;
      }
    });
    if (project.hasView) {
      sql += `-- Widok: ${project.viewDetails.name}\n`;
      sql += `CREATE VIEW IF NOT EXISTS ${project.viewDetails.name} AS\n${project.viewDetails.sql || '-- SQL view definition'};`;
    }
    return sql;
  };

  const generateMarkdown = () => {
    return `# Projekt: ${project.title}\n\n## Opis\n${project.problemStatement}\n\n## SQL\n\`\`\`sql\n${getSqlExport()}\n\`\`\``;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Skopiowano!');
  };

  return (
    <div className="h-screen bg-white text-slate-900 font-sans overflow-hidden flex flex-col">
      {/* Top Navigation / Metadata Rail */}
      <nav className="flex justify-between items-end border-b-2 border-slate-900 p-6">
        <div className="flex flex-col">
          <span className="label-xs">Przedmiot</span>
          <span className="text-sm font-black">PODSTAWY BAZ DANYCH 2025/26</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="label-xs">Prowadzący</span>
          <span className="text-sm font-black uppercase">Dr Sinan Tankut Gülhan</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="label-xs">Waga Projektu</span>
          <span className="text-sm font-black italic">50% OCENY KOŃCOWEJ</span>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Left Column */}
        <aside className="w-80 border-r-2 border-slate-900 bg-white flex flex-col overflow-y-auto">
          <div className="p-8 border-b-2 border-slate-900 bg-slate-50">
            <h1 className="text-[56px] leading-[0.85] font-black tracking-tighter text-slate-900 mb-6 uppercase">
              PROJEKT<br/>KONCOWY
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center text-xl font-black italic">15</div>
              <div className="text-[10px] uppercase tracking-widest font-black leading-tight text-slate-400">
                Prezentacja:<br/>
                <span className="text-sm text-rose-600">Tydzień 15</span>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <h2 className="label-xs px-4 mb-4">Etapy Projektu</h2>
            {steps.map(step => (
              <SidebarItem 
                key={step.id} 
                icon={step.icon} 
                label={step.label} 
                isActive={currentStep === step.id} 
                onClick={() => setCurrentStep(step.id)} 
                isCompleted={false} 
              />
            ))}
          </nav>

          <div className="mt-auto p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">Postęp projektu</span>
               <span className="text-[10px] font-black italic text-rose-500">{(steps.findIndex(s => s.id === currentStep) + 1)} / 6</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
              <motion.div 
                className="bg-rose-600 h-full"
                animate={{ width: `${(steps.findIndex(s => s.id === currentStep) + 1) / steps.length * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
          <div className="flex-1 p-12 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentStep} 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.02 }} 
                className="space-y-12"
              >
                <header className="border-b-4 border-slate-900 pb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                      {steps.find(s => s.id === currentStep)?.label}
                    </h2>
                    <p className="mt-4 text-lg font-medium text-slate-500 max-w-xl">
                      {currentStep === ProjectStep.INTRO && "Poznaj cele projektu i wymagania techniczne."}
                      {currentStep === ProjectStep.CONCEPT && "Zdefiniuj problem badawczy i cel Twojej bazy danych."}
                      {currentStep === ProjectStep.SCHEMA && "Zaprojektuj relacyjny model danych składający się z minimum 4 tabel."}
                      {currentStep === ProjectStep.DATA && "Wprowadź testowe dane pozwalające na weryfikację struktury."}
                      {currentStep === ProjectStep.QUERIES && "Sformułuj zapytania SQL, które wydobędą kluczowe informacje."}
                      {currentStep === ProjectStep.ADVANCED && "Zwiększ funkcjonalność bazy poprzez widoki i elementy zaawansowane."}
                      {currentStep === ProjectStep.EXPORT && "Pobierz gotowy kod SQL oraz sprawozdanie Markdown."}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[88px] font-black italic text-slate-900/10 leading-none select-none">
                      0{steps.findIndex(s => s.id === currentStep) + 1}
                    </span>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-8">
                  {currentStep === ProjectStep.INTRO && (
                    <div className="grid grid-cols-12 gap-12 items-start">
                      <div className="col-span-12 lg:col-span-7 space-y-10">
                        <section className="space-y-4">
                          <h3 className="text-3xl font-black uppercase tracking-tighter italic">Dlaczego Bazy Danych?</h3>
                          <p className="text-slate-600 leading-relaxed text-lg">
                            W dzisiejszym świecie dane są najcenniejszym aktywem. Umiejętność projektowania relacyjnych struktur to nie tylko domena programistów, ale podstawa analityki biznesowej, nauki o danych i nowoczesnego zarządzania. Ten projekt ma na celu pokazanie Ci, jak przejść od surowego pomysłu do ustrukturyzowanej wiedzy.
                          </p>
                        </section>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 border-4 border-slate-900 bg-white">
                              <DatabaseZap className="mb-4 text-rose-600" size={32} />
                              <h4 className="font-black uppercase text-sm mb-2">Praktyczne zastosowanie</h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Każdy system, którego używasz — od Spotify po e-dziekanat — opiera się na relacjach. Ty zbudujesz mniejszy, ale równie logiczny model.
                              </p>
                           </div>
                           <div className="p-6 border-4 border-slate-900 bg-white">
                              <ShieldCheck className="mb-4 text-rose-600" size={32} />
                              <h4 className="font-black uppercase text-sm mb-2">Waga Projektu</h4>
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                To zadanie stanowi 50% Twojej oceny końcowej. Skupiamy się na jakości struktury i poprawności zapytań SQL.
                              </p>
                           </div>
                        </div>

                        <section className="space-y-4">
                          <h3 className="text-xl font-black uppercase tracking-tight">Czego oczekujemy?</h3>
                          <div className="space-y-4">
                             {[
                               { t: 'Koncepcja', d: 'Zidentyfikowanie problemu społecznego lub organizacyjnego.' },
                               { t: 'Integralność', d: 'Zastosowanie kluczy (PK, FK) oraz więzów NOT NULL i UNIQUE.' },
                               { t: 'Analiza', d: 'Wydobycie wiedzy za pomocą 6 złożonych zapytań SELECT.' }
                             ].map((item, i) => (
                               <div key={i} className="flex gap-4 items-start">
                                  <div className="mt-1 w-2 h-2 bg-rose-600 rotate-45 shrink-0" />
                                  <div>
                                    <span className="block font-black text-xs uppercase">{item.t}</span>
                                    <span className="text-sm text-slate-500">{item.d}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        </section>
                      </div>

                      <aside className="col-span-12 lg:col-span-5 bg-slate-900 p-8 text-white space-y-8">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-500 mb-6 border-b border-white/10 pb-4">Wymagania Techniczne</h3>
                          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                            <div>
                               <span className="text-4xl font-black text-white block">04</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Główne Tabele</span>
                            </div>
                            <div>
                               <span className="text-4xl font-black text-white block">03</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relacje (FK)</span>
                            </div>
                            <div>
                               <span className="text-4xl font-black text-white block">06</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zapytania SELECT</span>
                            </div>
                            <div>
                               <span className="text-4xl font-black text-white block">08</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rekordów / Tabelę</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 border-t border-white/10 pt-8">
                           <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 size={16} className="text-rose-500" /> Gotowy na start?
                           </h4>
                           <p className="text-[11px] text-slate-400 font-medium italic">
                             Projekt zakończysz wygenerowaniem notatnika Google Colab (.ipynb), który jest wymagany do zaliczenia przedmiotu.
                           </p>
                           <button 
                            onClick={() => setCurrentStep(ProjectStep.CONCEPT)}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3"
                           >
                              ROZPOCZNIJ PROJEKT <ArrowRight size={16} />
                           </button>
                        </div>
                      </aside>
                    </div>
                  )}

                  {currentStep === ProjectStep.CONCEPT && (
                    <div className="grid grid-cols-12 gap-8 items-start">
                      <div className="col-span-8 space-y-6">
                        <div className="space-y-2">
                          <label className="label-xs">Tytuł Projektu</label>
                          <input 
                            className="w-full p-4 border-2 border-slate-900 bg-white text-xl font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-rose-500/10" 
                            placeholder="Wpisz nazwę..." 
                            value={project.title} 
                            onChange={e => setProject({...project, title: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="label-xs">Problem badawczy / Opis bazy</label>
                          <textarea 
                            className="w-full p-4 border-2 border-slate-900 bg-white min-h-[300px] text-lg leading-relaxed placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-rose-500/10 resize-none" 
                            placeholder="Czego dotyczy Twój projekt? (System wolontariatu, biblioteka...)" 
                            value={project.problemStatement} 
                            onChange={e => setProject({...project, problemStatement: e.target.value})} 
                          />
                        </div>
                      </div>
                      <div className="col-span-4 space-y-6">
                        <div className="p-6 bg-slate-900 text-white space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <DatabaseZap className="text-rose-500" size={16} /> WZORZEC PROJEKTU
                          </h3>
                          <p className="text-[11px] opacity-70 leading-relaxed italic">
                            Brakuje Ci pomysłu? Załaduj wzorcową bazę "System Wolontariatu NGO", aby zobaczyć oczekiwany poziom złożoności.
                          </p>
                          <button 
                            onClick={loadTemplate} 
                            className="w-full py-4 bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]"
                          >
                             ZAŁADUJ PRZYKŁAD
                          </button>
                        </div>
                        
                        <div className="p-6 border-2 border-slate-900 bg-white space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest">Krótka ściąga:</h3>
                          <ul className="space-y-2">
                             {[
                               'Dokładnie 4 tabele',
                               'Min. 3 relacje (FK)',
                               'PK w każdej tabeli',
                               '8-10 rekordów na tabelę'
                             ].map((text, i) => (
                               <li key={i} className="text-[10px] font-bold flex items-center gap-2">
                                 <div className="w-1 h-1 bg-rose-600 rotate-45" /> {text}
                               </li>
                             ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === ProjectStep.SCHEMA && (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center bg-slate-900 p-6 text-white">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest">Projektowanie Tabel</h3>
                          <p className="text-[10px] opacity-60">Wymagane: minimum 4 główne tabele encji.</p>
                        </div>
                        <button 
                          onClick={() => setProject({...project, entities: [...project.entities, { id: crypto.randomUUID(), name: 'T_TABELA', description: '', columns: [{ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isNullable: false, isUnique: true }] }]})} 
                          className="bg-rose-600 px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                          + Nowa Tabela
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {project.entities.map((t, idx) => (
                          <div key={t.id} className="border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-slate-100 pb-4">
                              <input 
                                className="text-xl font-black uppercase bg-transparent outline-none border-b-2 border-transparent focus:border-rose-500 transition-all w-2/3" 
                                value={t.name} 
                                onChange={e => { const u = [...project.entities]; u[idx].name = e.target.value; setProject({...project, entities: u}); }} 
                              />
                              <button onClick={() => setProject({...project, entities: project.entities.filter(it => it.id !== t.id)})} className="text-rose-600 hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                            </div>
                            <div className="space-y-3">
                              {t.columns.map((c, cidx) => (
                                <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                                   <div className="col-span-5">
                                     <input className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" value={c.name} onChange={e => { const u = [...project.entities]; u[idx].columns[cidx].name = e.target.value; setProject({...project, entities: u}); }} />
                                   </div>
                                   <div className="col-span-4">
                                     <select className="w-full text-[10px] font-black p-2 bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" value={c.type} onChange={e => { const u = [...project.entities]; u[idx].columns[cidx].type = e.target.value as any; setProject({...project, entities: u}); }}>
                                       <option>INTEGER</option><option>TEXT</option><option>REAL</option>
                                     </select>
                                   </div>
                                   <div className="col-span-2 flex justify-center">
                                     <button onClick={() => { const u = [...project.entities]; u[idx].columns[cidx].isPrimaryKey = !c.isPrimaryKey; setProject({...project, entities: u}); }} className={`w-8 h-8 flex items-center justify-center text-[10px] font-black border-2 transition-all ${c.isPrimaryKey ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-300 border-slate-200'}`}>PK</button>
                                   </div>
                                   <div className="col-span-1">
                                     <button onClick={() => { const u = [...project.entities]; u[idx].columns = u[idx].columns.filter(cit => cit.id !== c.id); setProject({...project, entities: u}); }} className="text-slate-300 hover:text-rose-600"><Trash2 size={14} /></button>
                                   </div>
                                </div>
                              ))}
                              <button onClick={() => { const u = [...project.entities]; u[idx].columns.push({ id: crypto.randomUUID(), name: 'nowa', type: 'TEXT', isPrimaryKey: false, isNullable: true, isUnique: false }); setProject({...project, entities: u}); }} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-300 text-[10px] uppercase font-black tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all">+ Dodaj Kolumnę</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === ProjectStep.QUERIES && (
                    <div className="space-y-12">
                      <div className="bg-rose-50 border-l-8 border-rose-600 p-8">
                         <h3 className="text-xl font-black uppercase text-rose-900 mb-2 italic underline underline-offset-8">Wymagania Analizy SQL</h3>
                         <p className="text-sm text-rose-800 font-medium leading-relaxed max-w-2xl">
                           Musi obejmować minimum 6 zapytań selekcyjnych wykorzystujących: JOIN (x2), GROUP BY, HAVING, ORDER BY oraz WHERE.
                         </p>
                      </div>

                      <div className="space-y-6">
                        {project.queries.map((q, idx) => (
                          <div key={q.id} className="grid grid-cols-12 gap-6 bg-white border-2 border-slate-900 p-8 shadow-[12px_12px_0px_0px_rgba(244,63,94,0.1)]">
                            <div className="col-span-4">
                              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 uppercase tracking-widest mb-4 inline-block">Query 0{idx+1}</span>
                              <h4 className="text-xl font-black uppercase tracking-tighter leading-tight mb-2">{q.label}</h4>
                              <p className="text-xs text-slate-400 font-medium">{q.description}</p>
                            </div>
                            <div className="col-span-8">
                              <textarea 
                                className="w-full bg-slate-900 text-rose-400 p-6 font-mono text-sm border-4 border-slate-800 focus:border-slate-900 outline-none leading-relaxed' min-h-[160px]" 
                                value={q.sql} 
                                onChange={e => { const u = [...project.queries]; u[idx].sql = e.target.value; setProject({...project, queries: u}); }} 
                                placeholder="SELECT ... FROM ... WHERE ..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === ProjectStep.EXPORT && (
                    <div className="flex flex-col items-center justify-center space-y-12 py-20">
                      <div className="relative">
                        <div className="w-32 h-32 border-4 border-slate-900 rotate-45 flex items-center justify-center p-4">
                          <CheckCircle2 className="-rotate-45 text-rose-600" size={64} />
                        </div>
                        <div className="absolute -top-4 -right-4 bg-slate-900 text-white px-3 py-1 font-black text-xs uppercase tracking-widest">Done</div>
                      </div>

                      <div className="text-center space-y-4">
                         <h3 className="text-5xl font-black uppercase tracking-tighter">Konfiguracja Zakończona</h3>
                         <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto">
                           Baza danych została pomyślnie zamodelowana. Możesz teraz skopiować kod SQL do środowiska SQLite oraz pobrać dokumentację.
                         </p>
                      </div>

                      <div className="flex gap-6 w-full max-w-2xl">
                          <button onClick={() => copyToClipboard(getSqlExport())} className="flex-1 bg-slate-900 text-white p-8 border-4 border-slate-900 hover:bg-white hover:text-slate-900 transition-all group">
                             <Code className="mb-4 text-rose-500 group-hover:scale-125 transition-transform" size={40} />
                             <span className="block font-black text-lg uppercase tracking-tighter">Kopiuj SQL (DDL)</span>
                             <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-2 block">Kod gotowy do Colabu</span>
                          </button>
                          <button onClick={() => copyToClipboard(generateMarkdown())} className="flex-1 bg-white text-slate-900 p-8 border-4 border-slate-900 hover:bg-slate-900 hover:text-white transition-all group">
                             <FileText className="mb-4 text-rose-500 group-hover:scale-125 transition-transform" size={40} />
                             <span className="block font-black text-lg uppercase tracking-tighter">Dokumentacja (.md)</span>
                             <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-2 block">Raport Końcowy</span>
                          </button>
                      </div>
                    </div>
                  )}

                  {currentStep === ProjectStep.DATA && (
                    <div className="space-y-12">
                      <div className="bg-slate-900 p-8 text-white">
                         <h3 className="text-xl font-black uppercase tracking-widest italic mb-2">Zasilanie Bazy (DML)</h3>
                         <p className="text-xs text-slate-400 font-medium">Wprowadź po ok. 8-10 rekordów na tabelę, aby przetestować relacje.</p>
                      </div>

                      <div className="space-y-16">
                        {project.entities.map((t, idx) => (
                           <div key={t.id} className="space-y-6">
                              <div className="flex items-center gap-3 border-b-4 border-slate-900 pb-2">
                                <span className="text-2xl font-black uppercase italic tracking-tighter">{t.name}</span>
                                <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 uppercase tracking-widest">{t.rows?.length || 0} rekordów</span>
                              </div>

                              {/* Form to add record */}
                              <div className="bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.1)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                   {t.columns.map(col => (
                                     <div key={col.id} className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 flex justify-between">
                                          {col.name} 
                                          {col.isPrimaryKey && <span className="text-rose-600">PK</span>}
                                        </label>
                                        <input 
                                          className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 outline-none focus:border-slate-900"
                                          data-table-id={t.id}
                                          data-col-name={col.name}
                                          id={`input-${t.id}-${col.name}`}
                                          placeholder={col.type}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const inputs = document.querySelectorAll(`[data-table-id="${t.id}"]`);
                                              const newRow: Record<string, any> = {};
                                              inputs.forEach(input => {
                                                const el = input as HTMLInputElement;
                                                const name = el.getAttribute('data-col-name')!;
                                                newRow[name] = el.value;
                                              });
                                              
                                              const updatedEntities = [...project.entities];
                                              updatedEntities[idx].rows = [...(updatedEntities[idx].rows || []), newRow];
                                              setProject({ ...project, entities: updatedEntities });
                                              
                                              // Clear inputs
                                              inputs.forEach(input => (input as HTMLInputElement).value = '');
                                            }
                                          }}
                                        />
                                     </div>
                                   ))}
                                </div>
                                <button 
                                  onClick={() => {
                                    const inputs = document.querySelectorAll(`[data-table-id="${t.id}"]`);
                                    const newRow: Record<string, any> = {};
                                    inputs.forEach(input => {
                                      const el = input as HTMLInputElement;
                                      const name = el.getAttribute('data-col-name')!;
                                      newRow[name] = el.value;
                                    });
                                    
                                    const updatedEntities = [...project.entities];
                                    updatedEntities[idx].rows = [...(updatedEntities[idx].rows || []), newRow];
                                    setProject({ ...project, entities: updatedEntities });
                                    
                                    // Clear inputs
                                    inputs.forEach(input => (input as HTMLInputElement).value = '');
                                  }}
                                  className="w-full py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all"
                                >
                                  + Dodaj Rekord
                                </button>
                              </div>

                              {/* Data Table */}
                              {t.rows && t.rows.length > 0 && (
                                <div className="border-2 border-slate-900 overflow-x-auto bg-white">
                                   <table className="w-full text-left border-collapse">
                                      <thead>
                                         <tr className="bg-slate-50 border-b-2 border-slate-900">
                                            {t.columns.map(col => (
                                              <th key={col.id} className="p-3 text-[10px] font-black uppercase tracking-widest border-r border-slate-200">{col.name}</th>
                                            ))}
                                            <th className="p-3 w-10"></th>
                                         </tr>
                                      </thead>
                                      <tbody>
                                         {t.rows.map((row, ridx) => (
                                           <tr key={ridx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                              {t.columns.map(col => (
                                                <td key={col.id} className="p-3 text-xs font-medium border-r border-slate-100">{row[col.name]}</td>
                                              ))}
                                              <td className="p-3 text-right">
                                                 <button 
                                                  onClick={() => {
                                                    const updatedEntities = [...project.entities];
                                                    updatedEntities[idx].rows = updatedEntities[idx].rows?.filter((_, i) => i !== ridx);
                                                    setProject({ ...project, entities: updatedEntities });
                                                  }}
                                                  className="text-slate-300 hover:text-rose-600 transition-colors"
                                                 >
                                                   <Trash2 size={12} />
                                                 </button>
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === ProjectStep.ADVANCED && (
                    <div className="p-20 text-center space-y-6">
                       <Layout className="mx-auto text-slate-100" size={120} />
                       <h3 className="text-2xl font-black uppercase tracking-tighter">Sekcja w przygotowaniu</h3>
                       <p className="text-slate-400 font-medium max-w-xs mx-auto">Pracujemy nad uproszczeniem widoków i elementów zaawansowanych.</p>
                       <button onClick={() => setCurrentStep(ProjectStep.EXPORT)} className="text-rose-600 font-black uppercase tracking-widest text-xs underline underline-offset-8">Przejdź do Eksportu</button>
                    </div>
                  )}
                </div>

                <footer className="pt-12 flex justify-between items-center border-t-2 border-slate-900/10">
                  <button 
                    onClick={() => { const idx = steps.findIndex(s => s.id === currentStep); if (idx > 0) setCurrentStep(steps[idx - 1].id); }} 
                    disabled={currentStep === ProjectStep.INTRO} 
                    className="group flex items-center gap-4 text-slate-300 font-black uppercase tracking-widest text-xs hover:text-slate-900 disabled:opacity-10 transition-colors"
                  >
                    <ChevronRight size={24} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
                    Wstecz
                  </button>
                  <button 
                    onClick={() => { const idx = steps.findIndex(s => s.id === currentStep); if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id); }} 
                    disabled={!canProgress} 
                    className={`px-16 py-6 border-4 font-black uppercase tracking-widest text-sm transition-all ${
                      canProgress 
                        ? 'bg-slate-900 text-white border-slate-900 hover:bg-rose-600 hover:border-rose-600 shadow-[8px_8px_0px_0px_rgba(244,63,94,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none' 
                        : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Kontynuuj Etap
                  </button>
                </footer>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="bg-slate-900 text-white h-16 flex items-center justify-between px-10 mt-auto border-t-2 border-slate-900">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] italic text-slate-400">
              Uniwersytet Zielonogórski | Instytut Informatyki
            </span>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
              SQL CORE ARCHITECT v1.0
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
