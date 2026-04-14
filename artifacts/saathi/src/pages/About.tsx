import { Heart, BrainCircuit, Users, Building, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="flex flex-col w-full py-12 md:py-24">
      <div className="max-w-4xl mx-auto px-4 md:px-8 w-full">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">The Story Behind Saathi</h1>
          <p className="text-xl text-muted-foreground">Because no student should have to navigate their darkest moments alone.</p>
        </div>

        {/* The Problem */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
            <BrainCircuit className="w-6 h-6" />
            The Silent Crisis
          </h2>
          <div className="bg-card border border-border p-6 md:p-8 rounded-2xl space-y-6">
            <p className="text-lg text-white">India has over 250 million students. The pressure to succeed — in board exams, JEE, NEET, and beyond — is immense. The expectations are heavy, and the fear of failure is paralyzing.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-background p-4 rounded-xl border border-border">
                <div className="text-3xl font-bold text-secondary mb-2">1 in 3</div>
                <p className="text-muted-foreground text-sm">students report severe anxiety related to academics and future prospects.</p>
              </div>
              <div className="bg-background p-4 rounded-xl border border-border">
                <div className="text-3xl font-bold text-primary mb-2">1 : 500</div>
                <p className="text-muted-foreground text-sm">counselor-to-student ratio in typical Indian educational institutions.</p>
              </div>
              <div className="bg-background p-4 rounded-xl border border-border">
                <div className="text-3xl font-bold text-rose-400 mb-2">2 AM</div>
                <p className="text-muted-foreground text-sm">the time when most students feel the most isolated and overwhelmed with their thoughts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution / Vision */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-3">
            <Heart className="w-6 h-6" />
            Our Vision
          </h2>
          <div className="space-y-6 text-white/90 text-lg leading-relaxed">
            <p>
              Saathi was built to bridge this gap. We are a voice-first AI companion trained specifically on the emotional context of Indian students.
            </p>
            <p>
              We believe talking is healing. Typing out a panic attack is hard, but speaking to a calm, non-judgmental voice can interrupt the cycle of anxiety. Saathi isn't just a chatbot; it's a multi-agent system designed to act as an empathetic listener, a study strategist, and a reality checker.
            </p>
          </div>
        </section>

        {/* Gov Alignment */}
        <section className="mb-20">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-border">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Aligning with State Goals</h3>
                  <p className="text-muted-foreground mb-4">Saathi is actively being developed to align with the mental health and educational frameworks of the Government of Karnataka.</p>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <strong>Samagra Shikshana Karnataka:</strong> Supporting holistic student well-being.
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <strong>DIKSHA Integration:</strong> Providing emotional support alongside digital learning.
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <strong>Goal 2025:</strong> Reaching 500+ schools across Karnataka to provide free access.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6" />
            The Team
          </h2>
          <div className="flex items-center gap-6 bg-card border border-border p-6 rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              A
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Anushree</h3>
              <p className="text-primary font-medium mb-2">Founder & Developer</p>
              <p className="text-muted-foreground">
                Building Saathi to be the friend I wish I had during my own board exams.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}