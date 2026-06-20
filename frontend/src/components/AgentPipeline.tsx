import { motion } from "framer-motion";
import { Heart, BookOpen, BrainCircuit, ShieldAlert } from "lucide-react";
import type { SaathiPipelineStep } from "@/lib/api";

const AGENT_META = [
  { name: "Empathy",       icon: Heart,        color: "text-rose-400" },
  { name: "Study Advisor", icon: BookOpen,     color: "text-blue-400" },
  { name: "Mental Health", icon: BrainCircuit, color: "text-secondary" },
  { name: "Reality Check", icon: ShieldAlert,  color: "text-primary" },
];

type AgentPipelineProps = {
  pipeline: SaathiPipelineStep[];
};

export default function AgentPipeline({ pipeline }: AgentPipelineProps) {
  return (
    <div className="mt-2 space-y-1.5 pl-1">
      {pipeline.map((step, si) => {
        const meta = AGENT_META.find((a) => a.name === step.agent) ?? AGENT_META[si % AGENT_META.length];
        const Icon = meta.icon;
        return (
          <motion.div
            key={si}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: si * 0.08 }}
            className="flex items-start gap-2 bg-background/50 border border-border/40 rounded-xl px-3 py-2"
          >
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
            <div>
              <span className={`text-xs font-semibold ${meta.color}`}>{step.agent}</span>
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{step.insight}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
