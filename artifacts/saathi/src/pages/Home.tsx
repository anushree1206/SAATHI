import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Heart, BookOpen, BrainCircuit, ShieldAlert, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full py-24 lg:py-32 overflow-hidden flex items-center justify-center min-h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30 mb-8"
          >
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Voice-first AI Companion</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl"
          >
            Your late-night <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">safe space</span> for when things get heavy.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl"
          >
            Saathi listens to your struggles with JEE, NEET, family expectations, and everything in between. Just talk. We understand.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/demo" data-testid="btn-hero-try">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/25 w-full sm:w-auto">
                Talk to Saathi Now
              </Button>
            </Link>
            <Link href="/about" data-testid="btn-hero-about">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-border hover:bg-card w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The 4 Agents Section */}
      <section className="py-24 bg-card/30 relative">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Four Friends. One Saathi.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Different moments need different kinds of support. Saathi dynamically adapts to what you need right now.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Empathy", desc: "For when you just need someone to listen without judging.", icon: Heart, color: "text-rose-400", bg: "bg-rose-400/10" },
              { title: "Study Advisor", desc: "For tackling burnout and managing that impossible syllabus.", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
              { title: "Mental Health", desc: "For the dark nights when anxiety and panic feel overwhelming.", icon: BrainCircuit, color: "text-secondary", bg: "bg-secondary/10" },
              { title: "Reality Check", desc: "For gentle but firm truths when you need a new perspective.", icon: ShieldAlert, color: "text-primary", bg: "bg-primary/10" }
            ].map((agent, i) => (
              <Card key={i} className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full ${agent.bg} ${agent.color} flex items-center justify-center mb-4`}>
                    <agent.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{agent.title}</h3>
                  <p className="text-muted-foreground text-sm">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 mb-2">
              <span className="text-sm font-medium">Why Saathi?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">Built for the Indian Student Experience</h2>
            <p className="text-lg text-muted-foreground">We don't give generic advice. Saathi understands the weight of "log kya kahenge", the pressure of entrance exams, and the complexity of Indian households.</p>
            <ul className="space-y-4 pt-4">
              {[
                "Speaks English, Hindi, Kannada, Telugu, and Tamil",
                "Voice-first interface — talking is easier than typing",
                "100% private and judgment-free",
                "Available 24/7, especially at 2 AM"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                  </div>
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full relative">
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-tr from-card to-background border border-border flex items-center justify-center p-8 relative shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
              <div className="relative w-full h-full flex flex-col gap-4">
                <div className="self-end bg-primary/20 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%]">
                  "I feel like I'm disappointing my parents if I don't get into an IIT."
                </div>
                <div className="self-start bg-secondary/20 text-white p-4 rounded-2xl rounded-tl-sm max-w-[80%] border border-secondary/30">
                  "That's a huge weight to carry. Your worth isn't defined by an exam, even if it feels that way right now. Let's talk about what you actually want."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Government Alignment */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <GraduationCap className="w-12 h-12 text-secondary mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Aligned with Education Initiatives</h2>
          <p className="text-muted-foreground mb-8">
            Saathi is designed to support the well-being goals of Samagra Shikshana Karnataka, integrate with DIKSHA's digital learning environment, and empower youth through Skill Connect Karnataka.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 bg-card rounded-lg text-sm font-medium text-white border border-border">Samagra Shikshana</span>
            <span className="px-4 py-2 bg-card rounded-lg text-sm font-medium text-white border border-border">DIKSHA</span>
            <span className="px-4 py-2 bg-card rounded-lg text-sm font-medium text-white border border-border">Skill Connect</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">You don't have to carry it alone.</h2>
          <p className="text-xl text-white/80 mb-10">Saathi is here. Anytime. Anywhere.</p>
          <Link href="/demo" data-testid="btn-bottom-try">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-full px-10 h-16 text-xl shadow-xl shadow-primary/25">
              Talk to Saathi Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}