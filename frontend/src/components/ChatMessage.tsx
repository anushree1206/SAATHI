import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import AgentPipeline from "@/components/AgentPipeline";
import type { SaathiPipelineStep } from "@/lib/api";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  pipeline?: SaathiPipelineStep[];
  index: number;
  pipelineOpen: boolean;
  onTogglePipeline: () => void;
};

export default function ChatMessage({
  role, content, pipeline, index, pipelineOpen, onTogglePipeline,
}: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full flex-col ${role === "user" ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
          role === "user"
            ? "bg-primary/20 border border-primary/30 text-white rounded-br-sm"
            : "bg-background border border-border text-white rounded-bl-sm"
        }`}
        data-testid={`message-${role}-${index}`}
      >
        {content}
      </div>

      {role === "assistant" && pipeline && pipeline.length > 0 && (
        <div className="max-w-[80%] mt-1.5">
          <button
            onClick={onTogglePipeline}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors px-1"
          >
            {pipelineOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            How Saathi thought about this
          </button>
          <AnimatePresence>
            {pipelineOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <AgentPipeline pipeline={pipeline} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
