"use client";

import React from 'react';
import { Award, Download, Share2, Shield, Calendar, Zap, BookOpen } from 'lucide-react';

interface CertificadoProps {
  userName: string;
  wpm: number;
  comprehension: number;
  date: string;
}

export function Certificado({ userName, wpm, comprehension, date }: CertificadoProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-fade-in print:p-0">
      {/* Printable Certificate Frame */}
      <div 
        id="sprintread-certificate"
        className="w-full max-w-2xl aspect-[1.414/1] bg-linear-to-b from-[#FAF6EE] to-[#FFF] border-8 border-amber-400 p-8 flex flex-col justify-between relative shadow-2xl rounded-3xl overflow-hidden print:border-4 print:shadow-none"
        style={{
          boxShadow: '0 25px 50px -12px rgba(217, 119, 6, 0.15), inset 0 0 40px rgba(217, 119, 6, 0.05)',
        }}
      >
        {/* Background visual watermarks */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-foreground print:text-lg">
              SprintRead
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest print:text-[6px]">
              Neuro-Entrenamiento Visual
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[9px] font-black text-amber-700 uppercase tracking-widest print:hidden">
            <Shield size={10} /> Certificado Oficial
          </div>
        </div>

        {/* Certificate Body */}
        <div className="flex flex-col items-center text-center my-6 z-10">
          <Award className="text-amber-500 mb-3 animate-pulse" size={48} />
          
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase print:text-2xl">
            Certificado de Logro
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Otorgado con distinción de excelencia lectora a
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 border-b-2 border-amber-300 pb-2 px-6 mt-4 max-w-md truncate font-sans">
            {userName}
          </h2>

          <p className="text-xs text-gray-500 max-w-md leading-relaxed mt-4">
            Por haber superado con éxito las evaluaciones rigurosas de la metodología SprintRead, logrando una tasa de procesamiento de información sobresaliente en textos de nivel académico.
          </p>
        </div>

        {/* Certificate Metrics & Footer */}
        <div className="grid grid-cols-3 items-end border-t border-amber-100 pt-4 z-10">
          
          {/* Speed */}
          <div className="flex flex-col items-start pl-2">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-amber-500 fill-amber-500" /> Velocidad
            </span>
            <span className="text-2xl font-black text-foreground mt-0.5">{wpm} WPM</span>
          </div>

          {/* Verification Badge */}
          <div className="flex flex-col items-center justify-center relative">
            {/* Visual Gold Seal */}
            <div className="w-16 h-16 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-[9px] tracking-wider uppercase shadow-md border-4 border-white animate-spin-slow">
              SELLO
            </div>
          </div>

          {/* Comprehension */}
          <div className="flex flex-col items-end pr-2">
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <BookOpen size={10} className="text-amber-500" /> Comprensión
            </span>
            <span className="text-2xl font-black text-foreground mt-0.5">{comprehension} %</span>
          </div>

        </div>

        {/* Tiny Verification Metadata */}
        <div className="flex justify-between items-center text-[7px] text-gray-400 font-semibold uppercase tracking-wider mt-4 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1"><Calendar size={8} /> Fecha de Certificación: {date}</span>
          <span>ID Verificación: SR-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-transform"
        >
          <Download size={14} /> Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}
