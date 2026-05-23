import React from 'react';
import { motion } from 'motion/react';
import { Layers, HelpCircle, Info, Flame, LayoutGrid } from 'lucide-react';

export type LayoutTemplate = 'wedding' | 'seminar' | 'theater' | 'townhall';
export type StagePosition = 'depan' | 'samping' | 'tanpa_panggung';

export interface HallLayoutData {
  template: LayoutTemplate;
  stagePosition: StagePosition;
  tableQuantity: number;
  chairQuantity: number;
  selectedElementIds: string[];
}

interface HallLayoutCanvasProps {
  layoutData: HallLayoutData;
  onChange: (newData: HallLayoutData) => void;
  interactive?: boolean; // If false, acts as read-only (e.g., for Admin to view)
  maxTablesAvailable?: number;
  maxChairsAvailable?: number;
}

export default function HallLayoutCanvas({
  layoutData,
  onChange,
  interactive = true,
  maxTablesAvailable = 30,
  maxChairsAvailable = 250
}: HallLayoutCanvasProps) {
  const { template, stagePosition, tableQuantity, chairQuantity, selectedElementIds } = layoutData;

  const handleTemplateChange = (newTemplate: LayoutTemplate) => {
    if (!interactive) return;
    
    // Set typical quantities based on template
    let tables = 0;
    let chairs = 0;
    let elements: string[] = [];

    if (newTemplate === 'wedding') {
      tables = 6;
      chairs = 36;
      // pre-select elements
      for (let t = 0; t < 6; t++) {
        elements.push(`table-${t}`);
        for (let c = 0; c < 6; c++) {
          elements.push(`chair-${t}-${c}`);
        }
      }
    } else if (newTemplate === 'seminar') {
      tables = 12;
      chairs = 24;
      for (let t = 0; t < 12; t++) {
        elements.push(`table-${t}`);
        elements.push(`chair-${t}-0`);
        elements.push(`chair-${t}-1`);
      }
    } else if (newTemplate === 'theater') {
      tables = 0;
      chairs = 64;
      for (let c = 0; c < 64; c++) {
        elements.push(`theater-chair-${c}`);
      }
    } else if (newTemplate === 'townhall') {
      tables = 10;
      chairs = 20;
      for (let t = 0; t < 10; t++) {
        elements.push(`table-${t}`);
        elements.push(`chair-${t}-0`);
        elements.push(`chair-${t}-1`);
      }
    }

    // Bind within constraints
    tables = Math.min(tables, maxTablesAvailable);
    chairs = Math.min(chairs, maxChairsAvailable);

    onChange({
      ...layoutData,
      template: newTemplate,
      tableQuantity: tables,
      chairQuantity: chairs,
      selectedElementIds: elements
    });
  };

  const handleStageChange = (newStage: StagePosition) => {
    if (!interactive) return;
    onChange({
      ...layoutData,
      stagePosition: newStage
    });
  };

  const toggleElement = (id: string, isChair: boolean) => {
    if (!interactive) return;
    
    const index = selectedElementIds.indexOf(id);
    let newSelected = [...selectedElementIds];
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      // Check limits
      if (isChair) {
        const activeChairsCount = selectedElementIds.filter(x => x.includes('chair')).length;
        if (activeChairsCount >= maxChairsAvailable) return;
      } else {
        const activeTablesCount = selectedElementIds.filter(x => x.includes('table')).length;
        if (activeTablesCount >= maxTablesAvailable) return;
      }
      newSelected.push(id);
    }

    // Recalculate totals
    const finalChairs = newSelected.filter(x => x.includes('chair')).length;
    const finalTables = newSelected.filter(x => x.includes('table')).length;

    onChange({
      ...layoutData,
      selectedElementIds: newSelected,
      chairQuantity: finalChairs,
      tableQuantity: finalTables
    });
  };

  // Render SVG Layout elements based on template choice
  const renderLayoutElements = () => {
    const list: React.ReactNode[] = [];

    if (template === 'wedding') {
      // 6 circle configurations (each with 1 table in center and 6 chairs surrounding)
      const centerXList = [150, 350, 150, 350, 150, 350];
      const centerYList = [130, 130, 230, 230, 330, 330];
      const radiusTable = 24;
      const radiusChairs = 42;

      for (let t = 0; t < 6; t++) {
        const cx = centerXList[t];
        const cy = centerYList[t];
        const tableId = `table-${t}`;
        const isTableSelected = selectedElementIds.includes(tableId);

        // Center Table
        list.push(
          <g key={tableId} className={interactive ? "cursor-pointer" : ""}>
            <motion.circle
              cx={cx}
              cy={cy}
              r={radiusTable}
              fill={isTableSelected ? "url(#weddingTableActiveGrad)" : "#F3F4F6"}
              stroke={isTableSelected ? "#3B82F6" : "#D1D5DB"}
              strokeWidth="2"
              whileHover={interactive ? { scale: 1.08 } : {}}
              onClick={() => toggleElement(tableId, false)}
            />
            <text
              x={cx}
              y={cy + 4}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              fill={isTableSelected ? "#FFFFFF" : "#6B7280"}
              pointerEvents="none"
            >
              M-{t + 1}
            </text>
          </g>
        );

        // Chairs surrounding Table
        for (let c = 0; c < 6; c++) {
          const angle = (c * 60 * Math.PI) / 180;
          const chairX = cx + radiusChairs * Math.cos(angle);
          const chairY = cy + radiusChairs * Math.sin(angle);
          const chairId = `chair-${t}-${c}`;
          const isChairSelected = selectedElementIds.includes(chairId);

          list.push(
            <g key={chairId} className={interactive ? "cursor-pointer" : ""}>
              <motion.circle
                cx={chairX}
                cy={chairY}
                r={10}
                fill={isChairSelected ? "#3B82F6" : "#E5E7EB"}
                stroke={isChairSelected ? "#1D4ED8" : "#9CA3AF"}
                strokeWidth="1.5"
                whileHover={interactive ? { scale: 1.15 } : {}}
                onClick={() => toggleElement(chairId, true)}
              />
              <text
                x={chairX}
                y={chairY + 3}
                fontSize="7"
                fontWeight="bold"
                textAnchor="middle"
                fill={isChairSelected ? "#FFFFFF" : "#4B5563"}
                pointerEvents="none"
              >
                K
              </text>
            </g>
          );
        }
      }
    } else if (template === 'seminar') {
      // Classroom arrangement: Rows of combined desks and chairs facing the stage.
      // 4 columns, 3 rows of double tables
      const startX = 65;
      const startY = 120;
      const colSpacing = 100;
      const rowSpacing = 85;
      const tableW = 65;
      const tableH = 22;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const tIdx = r * 4 + c;
          const tx = startX + c * colSpacing;
          const ty = startY + r * rowSpacing;
          const tableId = `table-${tIdx}`;
          const isTableSelected = selectedElementIds.includes(tableId);

          // Table
          list.push(
            <g key={tableId} className={interactive ? "cursor-pointer" : ""}>
              <motion.rect
                x={tx}
                y={ty}
                width={tableW}
                height={tableH}
                rx="6"
                fill={isTableSelected ? "url(#seminarTableActiveGrad)" : "#F3F4F6"}
                stroke={isTableSelected ? "#3B82F6" : "#D1D5DB"}
                strokeWidth="2"
                whileHover={interactive ? { scale: 1.05 } : {}}
                onClick={() => toggleElement(tableId, false)}
              />
              <text
                x={tx + tableW / 2}
                y={ty + tableH / 2 + 3}
                fontSize="8"
                fontWeight="800"
                textAnchor="middle"
                fill={isTableSelected ? "#FFFFFF" : "#6B7280"}
                pointerEvents="none"
              >
                Meja {tIdx + 1}
              </text>
            </g>
          );

          // 2 chairs behind each table
          for (let ch = 0; ch < 2; ch++) {
            const chairX = tx + (ch === 0 ? 15 : tableW - 15);
            const chairY = ty + tableH + 12;
            const chairId = `chair-${tIdx}-${ch}`;
            const isChairSelected = selectedElementIds.includes(chairId);

            list.push(
              <g key={chairId} className={interactive ? "cursor-pointer" : ""}>
                <motion.rect
                  x={chairX - 8}
                  y={chairY - 8}
                  width={16}
                  height={16}
                  rx="4"
                  fill={isChairSelected ? "#3B82F6" : "#E5E7EB"}
                  stroke={isChairSelected ? "#1D4ED8" : "#9CA3AF"}
                  strokeWidth="1.5"
                  whileHover={interactive ? { scale: 1.2 } : {}}
                  onClick={() => toggleElement(chairId, true)}
                />
                <text
                  x={chairX}
                  y={chairY + 2}
                  fontSize="7"
                  fontWeight="black"
                  textAnchor="middle"
                  fill={isChairSelected ? "#FFFFFF" : "#4B5563"}
                  pointerEvents="none"
                >
                  K
                </text>
              </g>
            );
          }
        }
      }
    } else if (template === 'theater') {
      // Straight curved arches of chairs facing the stage
      // 8 rows of chairs, each row having 8 chairs
      const startR = 100;
      const rowGap = 35;
      const numRows = 7;
      const centerHallX = 250;
      const centerHallY = 60; // relative to stage at top

      for (let r = 0; r < numRows; r++) {
        const radius = startR + r * rowGap;
        // Calculate arch: angle from 25 to 155 degrees
        const numChairsInRow = 8 + r; // Expand row size as we go back
        const angleStep = 100 / (numChairsInRow - 1);
        
        for (let c = 0; c < numChairsInRow; c++) {
          const angleDeg = r % 2 === 0 ? (40 + c * angleStep) : (140 - c * angleStep); // alternates curves beautifully
          const angleRad = (angleDeg * Math.PI) / 180;
          const chairX = centerHallX + radius * Math.cos(angleRad);
          const chairY = centerHallY + radius * Math.sin(angleRad);

          const cIdx = r * 15 + c;
          const chairId = `theater-chair-${cIdx}`;
          const isChairSelected = selectedElementIds.includes(chairId);

          list.push(
            <g key={chairId} className={interactive ? "cursor-pointer" : ""}>
              <motion.circle
                cx={chairX}
                cy={chairY}
                r={8.5}
                fill={isChairSelected ? "#3B82F6" : "#E5E7EB"}
                stroke={isChairSelected ? "#1D4ED8" : "#9CA3AF"}
                strokeWidth="1.5"
                whileHover={interactive ? { scale: 1.2 } : {}}
                onClick={() => toggleElement(chairId, true)}
              />
            </g>
          );
        }
      }
    } else if (template === 'townhall') {
      // U-Shape Layout of Desks and chairs.
      // Left side, Bottom side, Right side
      const leftColX = 130;
      const rightColX = 370;
      const bottomRowY = 300;

      // Desks placement coordinates
      const positions = [
        // Left Column (facing inwards)
        { x: leftColX, y: 130, id: 'table-0', cx: leftColX - 22, cy: 130, isVert: true },
        { x: leftColX, y: 185, id: 'table-1', cx: leftColX - 22, cy: 185, isVert: true },
        { x: leftColX, y: 240, id: 'table-2', cx: leftColX - 22, cy: 240, isVert: true },
        // Right Column (facing inwards)
        { x: rightColX, y: 130, id: 'table-3', cx: rightColX + 22, cy: 130, isVert: true },
        { x: rightColX, y: 185, id: 'table-4', cx: rightColX + 22, cy: 185, isVert: true },
        { x: rightColX, y: 240, id: 'table-5', cx: rightColX + 22, cy: 240, isVert: true },
        // Bottom Row (facing upwards)
        { x: 180, y: bottomRowY, id: 'table-6', cx: 180, cy: bottomRowY + 22, isVert: false },
        { x: 235, y: bottomRowY, id: 'table-7', cx: 235, cy: bottomRowY + 22, isVert: false },
        { x: 290, y: bottomRowY, id: 'table-8', cx: 290, cy: bottomRowY + 22, isVert: false },
        { x: 345, y: bottomRowY, id: 'table-9', cx: 345, cy: bottomRowY + 22, isVert: false }
      ];

      positions.forEach((pos, idx) => {
        const isTableSelected = selectedElementIds.includes(pos.id);
        const w = pos.isVert ? 20 : 50;
        const h = pos.isVert ? 50 : 20;

        // Table rectangle
        list.push(
          <g key={pos.id} className={interactive ? "cursor-pointer" : ""}>
            <motion.rect
              x={pos.x - w/2}
              y={pos.y - h/2}
              width={w}
              height={h}
              rx="4"
              fill={isTableSelected ? "url(#townhallTableActiveGrad)" : "#F3F4F6"}
              stroke={isTableSelected ? "#3B82F6" : "#D1D5DB"}
              strokeWidth="2"
              whileHover={interactive ? { scale: 1.05 } : {}}
              onClick={() => toggleElement(pos.id, false)}
            />
            <text
              x={pos.x}
              y={pos.y + 3}
              fontSize="8"
              fontWeight="900"
              textAnchor="middle"
              fill={isTableSelected ? "#FFFFFF" : "#6B7280"}
              pointerEvents="none"
            >
              T-{idx}
            </text>
          </g>
        );

        // Chairs behind tables (U-Shape outline)
        for (let ch = 0; ch < 2; ch++) {
          const chairId = `chair-${idx}-${ch}`;
          const isChairSelected = selectedElementIds.includes(chairId);
          let cx = pos.cx;
          let cy = pos.cy;

          // separate the 2 chairs slightly along the length of table
          if (pos.isVert) {
            cy = pos.y + (ch === 0 ? -12 : 12);
          } else {
            cx = pos.x + (ch === 0 ? -12 : 12);
          }

          list.push(
            <g key={chairId} className={interactive ? "cursor-pointer" : ""}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={8.5}
                fill={isChairSelected ? "#3B82F6" : "#E5E7EB"}
                stroke={isChairSelected ? "#1D4ED8" : "#9CA3AF"}
                strokeWidth="1.5"
                whileHover={interactive ? { scale: 1.2 } : {}}
                onClick={() => toggleElement(chairId, true)}
              />
            </g>
          );
        }
      });
    }

    return list;
  };

  const getStageTransform = () => {
    switch (stagePosition) {
      case 'depan':
        return { x: 175, y: 30, w: 150, h: 35, title: 'PANGGUNG UTAMA (DEPAN)' };
      case 'samping':
        return { x: 410, y: 150, w: 35, h: 140, title: 'PANGGUNG\nSAMPING' };
      case 'tanpa_panggung':
      default:
        return null;
    }
  };

  const stage = getStageTransform();

  return (
    <div className="space-y-4">
      {interactive && (
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-3xl space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1 block mb-2">Preset Layout Rencana</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'wedding', label: 'Wedding / Resepsi', desc: 'Denah bundar melingkar' },
                { id: 'seminar', label: 'Classroom / Seminar', desc: 'Barisan meja & kursi rapi' },
                { id: 'theater', label: 'Theater / Konser', desc: 'Baris melingkar kursi saja' },
                { id: 'townhall', label: 'Rapat / Townhall', desc: 'Tata letak U-Shape berpasangan' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTemplateChange(opt.id as LayoutTemplate)}
                  className={`p-3 rounded-2xl border text-left transition-all ${template === opt.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/10' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                >
                  <p className="text-xs font-black tracking-tight">{opt.label}</p>
                  <p className={`text-[9px] mt-0.5 font-bold ${template === opt.id ? 'text-white/70' : 'text-gray-400'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1 block mb-2">Pilih Posisi Panggung</span>
              <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl w-fit">
                {[
                  { id: 'depan', label: 'Panggung Depan' },
                  { id: 'samping', label: 'Panggung Samping' },
                  { id: 'tanpa_panggung', label: 'Tanpa Panggung' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStageChange(opt.id as StagePosition)}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${stagePosition === opt.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    {opt.label.split(' ')[1] || opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-primary">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-[10px] font-bold leading-normal">
                  Tips: Anda bisa mengklik piringan meja atau lingkaran kursi pada denah di bawah untuk menambah/mengurangi unit secara interaktif.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actual Drawing Stage of Hall Layout */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-[2rem] p-4 overflow-hidden shadow-inner flex flex-col items-center">
        {/* Label and Statistics */}
        <div className="w-full flex justify-between items-center z-10 mb-2 border-b border-white/5 pb-2">
          <div>
            <h5 className="text-white text-xs font-black tracking-widest uppercase">PETA TATA LETAK Gedung Serbaguna Huntap Tondo 2</h5>
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Preset: {template.toUpperCase()} • Panggung: {stagePosition.toUpperCase()}</p>
          </div>
          <div className="flex gap-3 text-right">
            <div>
              <span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest block">Meja Aktif</span>
              <span className="text-blue-400 font-mono text-xs font-black">{tableQuantity} / {maxTablesAvailable}</span>
            </div>
            <div>
              <span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest block">Kursi Aktif</span>
              <span className="text-emerald-400 font-mono text-xs font-black">{chairQuantity} / {maxChairsAvailable}</span>
            </div>
          </div>
        </div>

        {/* 2D Grid Representation (using SVG) */}
        <div className="w-full max-w-md bg-slate-850 rounded-[1.5rem] border border-slate-700 overflow-hidden relative" style={{ aspectRatio: '500/400' }}>
          <svg viewBox="0 0 500 400" className="w-full h-full select-none">
            {/* Definitions for gorgeous gradients */}
            <defs>
              <linearGradient id="stageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DF9F28" />
                <stop offset="100%" stopColor="#87510E" />
              </linearGradient>
              <linearGradient id="weddingTableActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="seminarTableActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id="townhallTableActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>
              <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeOpacity="0.015" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Background Grid Pattern */}
            <rect width="500" height="400" fill="url(#gridPattern)" />

            {/* Outer Wall Boundaries */}
            <rect x="15" y="15" width="470" height="370" rx="20" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="6,4" />

            {/* Stage Graphic representation */}
            {stage && (
              <g>
                <rect
                  x={stage.x}
                  y={stage.y}
                  width={stage.w}
                  height={stage.h}
                  rx="6"
                  fill="url(#stageGrad)"
                  stroke="#FFC107"
                  strokeWidth="2.5"
                  className="shadow-xl"
                />
                {stage.title.split('\n').map((line, i) => (
                  <text
                    key={i}
                    x={stage.x + stage.w / 2}
                    y={stage.y + (stage.h / 2) + (i === 0 && stage.h > 40 ? -5 : i === 1 ? 10 : 4)}
                    fontSize="9"
                    fontWeight="900"
                    fill="#FFFFFF"
                    textAnchor="middle"
                    pointerEvents="none"
                    letterSpacing="1"
                  >
                    {line}
                  </text>
                ))}
              </g>
            )}

            {/* Main Seating / Table Grid drawing based on current layout preset */}
            {renderLayoutElements()}

            {/* Entrance Gate label marker */}
            <text x="250" y="392" fontSize="9" fontWeight="900" textAnchor="middle" fill="#4B5563" letterSpacing="2">
              ▲ PINTU MASUK UTAMA ▲
            </text>
          </svg>
        </div>
        
        {/* Footnotes indicator */}
        <p className="text-gray-500 text-[8px] font-black tracking-widest uppercase mt-3 text-center leading-relaxed">
          Semua denah diatur dengan ruang jalan aman bencana • Gedung Serbaguna Huntap Tondo 2
        </p>
      </div>
    </div>
  );
}
