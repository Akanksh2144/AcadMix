import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Database, Cpu, Atom, Blueprint, Lightning, 
  Gear, Cube, Wrench, HardHat, Compass, ArrowRight, Sparkle,
  Monitor, Pen, Hammer, Tree, ShieldCheck, GameController, 
  Wind, ChartLineUp, Broadcast, Equalizer, Pulse, Globe, House
} from '@phosphor-icons/react';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  state?: any;
  accent: string;
  tags: string[];
}

interface BranchConfig {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  tools: ToolCard[];
}

const BRANCHES: Record<string, BranchConfig> = {
  CSE: {
    name: 'Computer Science & IT',
    description: 'Cloud compilers, database playgrounds, and algorithm sandboxes.',
    icon: Terminal,
    gradient: 'from-purple-500 to-indigo-600',
    tools: [
      {
        id: 'code-playground',
        title: 'Code Playground',
        description: 'Multi-language cloud compiler supporting Python, Java, C/C++, Go, Rust, and JavaScript with standard input/output redirection.',
        icon: Terminal,
        path: 'code-playground',
        accent: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        tags: ['Compilers', 'IDE', 'All Languages']
      },
      {
        id: 'sql-practice',
        title: 'SQL Sandbox',
        description: 'Interactive database environment to run queries on pre-loaded schemas, analyze query execution plans, and practice DB optimization.',
        icon: Database,
        path: 'sql-practice',
        accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        tags: ['SQL', 'PostgreSQL', 'DBMS']
      }
    ]
  },
  ECE: {
    name: 'Electronics & Communication',
    description: 'Virtual instrumentation, circuit solvers, Verilog compilers, and PCB editors.',
    icon: Cpu,
    gradient: 'from-teal-500 to-emerald-600',
    tools: [
      {
        id: 'hardware-arena',
        title: 'ECE Lab (Hardware Arena)',
        description: 'Full simulation dashboard for circuits, digital systems, microprocessors, and signals.',
        icon: Cpu,
        path: 'hardware-arena',
        accent: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        tags: ['Virtual Lab', 'Circuits', 'DSP']
      },
      {
        id: 'vlsi-studio',
        title: 'VLSI Logic Studio',
        description: 'Write, compile, and run Verilog modules locally with dynamic timing diagrams and waveform analysis (VCD).',
        icon: Atom,
        path: 'code-playground',
        state: { language: 'ecelab', simCategory: 'vlsi', wokwiBoard: 'vlsi-native' },
        accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        tags: ['Verilog', 'VLSI', 'Digital Logic']
      },
      {
        id: 'pcb-studio',
        title: 'PCB Design Studio',
        description: 'Design multi-layer printed circuit boards, run Design Rule Checks (DRC), and export production-ready Gerber and BOM lists.',
        icon: Blueprint,
        path: 'code-playground',
        state: { language: 'ecelab', simCategory: 'pcb', wokwiBoard: 'pcb-native' },
        accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        tags: ['PCB', 'Gerber Export', 'EDA']
      }
    ]
  },
  EEE: {
    name: 'Electrical & Electronics',
    description: 'Power grid solvers, machine simulations, and industrial PLC control.',
    icon: Lightning,
    gradient: 'from-amber-500 to-yellow-600',
    tools: [
      {
        id: 'eee-lab-main',
        title: 'EEE Engineering Studio',
        description: 'Solve complex power electronics, control system stability plots (Bode, Root Locus), and electrical machine circuits.',
        icon: Lightning,
        path: 'code-playground',
        state: { language: 'eeelab' },
        accent: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        tags: ['Power Electronics', 'Machines', 'Grid Analysis']
      },
      {
        id: 'eee-control',
        title: 'Control Systems Lab',
        description: 'Tune PID parameters, simulate second-order systems, and check step responses in real-time.',
        icon: ChartLineUp,
        path: 'code-playground',
        state: { language: 'eeelab', simCategory: 'control_systems', wokwiBoard: 'cs-python' },
        accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        tags: ['PID Tuning', 'Control Loop', 'Feedback']
      },
      {
        id: 'eee-automation',
        title: 'Industrial PLC Simulator',
        description: 'Ladder logic programming interface with virtual conveyor belts, sensor triggers, and automation logs.',
        icon: Gear,
        path: 'code-playground',
        state: { language: 'eeelab', simCategory: 'industrial_automation', wokwiBoard: 'ia-acc-plc' },
        accent: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
        tags: ['PLC', 'Ladder Logic', 'SCADA']
      }
    ]
  },
  MECH: {
    name: 'Mechanical Engineering',
    description: 'CAD/BIM drafting, fluid dynamics, and thermodynamic cycles.',
    icon: Cube,
    gradient: 'from-rose-500 to-red-600',
    tools: [
      {
        id: 'cad-modeling',
        title: 'CAD modeling Studio',
        description: '2D/3D parametric modeling environment with canvas mesh rendering, vertex modifiers, and assembly constraint managers.',
        icon: Cube,
        path: 'cad-studio',
        accent: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        tags: ['CAD', '3D Engine', 'Modeling']
      },
      {
        id: 'mech-lab-main',
        title: 'Mech Lab Simulation',
        description: 'Simulate thermodynamic cycles (Otto, Diesel), heat exchangers, fluid mechanics, pumps, and CNC parameters.',
        icon: Wrench,
        path: 'code-playground',
        state: { language: 'mechlab' },
        accent: 'text-red-500 bg-red-500/10 border-red-500/20',
        tags: ['Thermodynamics', 'Fluids', 'CNC']
      },
      {
        id: 'mech-linkage',
        title: 'Four-Bar Mechanism Studio',
        description: 'Interactive kinematic solver for linkage geometries, transmission angles, and Grashof mobility tests.',
        icon: Gear,
        path: 'code-playground',
        state: { language: 'mechlab', simCategory: 'mechatronics', wokwiBoard: 'mech-four-bar' },
        accent: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        tags: ['Kinematics', 'Linkages', 'Mechanisms']
      }
    ]
  },
  CIVIL: {
    name: 'Civil Engineering',
    description: 'Structural calculators, soil mechanics, and hydrology networks.',
    icon: HardHat,
    gradient: 'from-orange-500 to-amber-600',
    tools: [
      {
        id: 'civil-lab-main',
        title: 'Civil Engineering Studio',
        description: 'Calculate beam deflections, soil bearing capacities, pipe flows, and concrete mix ratios.',
        icon: HardHat,
        path: 'code-playground',
        state: { language: 'civillab' },
        accent: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        tags: ['Structural', 'Concrete Mix', 'Estimating']
      },
      {
        id: 'civil-settlement',
        title: 'Settlement Calculator',
        description: 'Perform geotechnical foundation calculations for primary consolidation settlement in clay layers.',
        icon: Compass,
        path: 'code-playground',
        state: { language: 'civillab', simCategory: 'geotechnical', wokwiBoard: 'civil-geotech-studio' },
        accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        tags: ['Geotech', 'Soil Mechanics', 'Foundations']
      }
    ]
  }
};

interface StudentSoftwareToolsProps {
  user: any;
  navigate: (page: string, state?: any) => void;
}

export default function StudentSoftwareTools({ user, navigate }: StudentSoftwareToolsProps) {
  // Determine primary branch
  const userDept = String(user?.department || 'CSE').toUpperCase();
  
  let primaryBranchKey = 'CSE';
  if (['ECE', 'ET', 'EIE', 'IOT'].includes(userDept)) primaryBranchKey = 'ECE';
  else if (['EEE'].includes(userDept)) primaryBranchKey = 'EEE';
  else if (['MECH', 'ME'].includes(userDept)) primaryBranchKey = 'MECH';
  else if (['CIVIL', 'CE'].includes(userDept)) primaryBranchKey = 'CIVIL';
  
  const [selectedBranch, setSelectedBranch] = useState(primaryBranchKey);
  const activeBranch = BRANCHES[selectedBranch] || BRANCHES.CSE;

  return (
    <div className="space-y-8">
      {/* Dynamic Branch Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl bg-gradient-to-r ${BRANCHES[primaryBranchKey].gradient} text-white shadow-lg relative overflow-hidden`}>
        {/* Background Decorative Pattern */}
        <div className="absolute right-0 bottom-0 opacity-15 transform translate-y-4 translate-x-4 pointer-events-none">
          {React.createElement(BRANCHES[primaryBranchKey].icon, { size: 280, weight: 'duotone' })}
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
            {userDept} Department Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome to Your {BRANCHES[primaryBranchKey].name} Studio
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            AcadMix provides cloud-based virtual labs and engineering simulations tailored to your coursework. 
            Test designs, run simulations, and analyze metrics directly from your dashboard.
          </p>
        </div>
      </div>

      {/* Pill Shaped Branch Navigation Tab Bar */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Explore Engineering Domains
          </h3>
          <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
            <Sparkle size={14} weight="fill" className="animate-pulse" /> Multidisciplinary Access
          </span>
        </div>

        {/* 
          Vibe UI Pill Navigation: 
          - Pill shaped container (rounded-full)
          - Active tab container shape same as the external container (rounded-full)
        */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-full hide-scrollbar border border-slate-200/50 dark:border-slate-800/50">
          {Object.entries(BRANCHES).map(([key, branch]) => {
            const Icon = branch.icon;
            const isActive = selectedBranch === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedBranch(key)}
                className={`flex-1 justify-center flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap border border-transparent ${
                  isActive
                    ? 'bg-white dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shadow-sm border-slate-200/50 dark:border-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} weight="duotone" />
                {branch.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {activeBranch.tools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="soft-card-hover p-6 flex flex-col justify-between text-left group border border-slate-200/60 dark:border-slate-800/40 relative overflow-hidden"
              >
                <div>
                  {/* Tool Icon + Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tool.accent}`}>
                      <ToolIcon size={24} weight="duotone" />
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {tool.tags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">
                    {tool.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                    {tool.description}
                  </p>
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => navigate(tool.path, tool.state)}
                  className="w-full py-3 bg-slate-50 hover:bg-indigo-600 dark:bg-white/[0.02] dark:hover:bg-indigo-600/90 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-800/50 hover:border-transparent dark:hover:border-transparent transition-all shadow-sm"
                >
                  Launch Workspace
                  <ArrowRight size={14} weight="bold" className="transform group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
