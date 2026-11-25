import React from 'react';
import { Compass, Layers, Lightbulb, PenTool, TestTube2 } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';
import { AnimatedHeadline } from '../components/animations/AnimatedHeadline';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { Button } from '../components/common/Button';

const DESIGN_THINKING_STAGES = [
  {
    stage: '01 · Empathize',
    title: 'Understand student & leader reality',
    desc: 'Listen to how first-year students experience recruitment fairs and how core club leads handle semester workloads behind the scenes.',
    bg: 'bg-white border border-black/[0.08]',
    text: 'text-black',
    sub: 'text-[#615d59]',
    icon: Compass,
  },
  {
    stage: '02 · Define',
    title: 'Pinpoint why participation fades',
    desc: 'Frame the core friction around silent drop-offs, concentrated responsibilities on a few officers, and mismatched expectations.',
    bg: 'bg-[#e6f3fe]',
    text: 'text-black',
    sub: 'text-[#615d59]',
    icon: Layers,
  },
  {
    stage: '03 · Ideate',
    title: 'Explore transparent workflows',
    desc: 'Design upfront commitment disclosures, starter tasks, shared workload indicators, and multi-dimensional contribution records.',
    bg: 'bg-[#ffb110]',
    text: 'text-black',
    sub: 'text-black/80',
    icon: Lightbulb,
  },
  {
    stage: '04 · Prototype',
    title: 'Build a calm, modular workspace',
    desc: 'Assemble interactive discovery filters, a 6-step onboarding tracker, Kanban task boards, and dual Student/President views.',
    bg: 'bg-[#62aef0]',
    text: 'text-black',
    sub: 'text-black/85',
    icon: PenTool,
  },
  {
    stage: '05 · Test',
    title: 'Iterate on clarity & fairness',
    desc: 'Evaluate how clearly students can compare clubs and how easily club presidents can spot uneven task loads and support quiet members.',
    bg: 'bg-[#02093a]',
    text: 'text-white',
    sub: 'text-white/80',
    icon: TestTube2,
  },
];

export const AboutPage: React.FC = () => {
  return (
    <MainLayout>
      <section className="py-14 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header */}
          <div className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-3">
              About ClubConnect
            </p>
            <AnimatedHeadline
              as="h1"
              text="Designed around how student communities actually work."
              className="section-heading text-[38px] sm:text-[50px] lg:text-[54px] font-bold text-black"
            />
            <p className="mt-5 text-[18px] text-[#615d59] font-editorial leading-[1.6]">
              ClubConnect is a student club engagement and contribution management concept built to replace scattered spreadsheets and opaque sign-up sheets with one calm, transparent workspace.
            </p>
          </div>

          {/* How Might We Callout */}
          <ScrollReveal className="mt-12">
            <div className="rounded-[12px] bg-[#f6d5b8] border border-black/[0.08] p-8 sm:p-10">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-black/70 mb-2">
                Our Guiding How Might We Statement
              </div>
              <blockquote className="text-[22px] sm:text-[28px] font-editorial text-black leading-[1.35]">
                “How might we help clubs turn joiners into contributors, while helping students choose clubs whose reality matches their expectations?”
              </blockquote>
            </div>
          </ScrollReveal>

          {/* Problem & Solution */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollReveal>
              <div className="notion-card p-6 sm:p-8 h-full">
                <h2 className="card-heading font-bold text-black">The Problem Statement</h2>
                <p className="mt-3 text-[16px] text-[#615d59] leading-[1.6]">
                  Student clubs often experience declining member participation, uneven task distribution, leadership burnout, and recruitment expectation gaps. Newcomers sign up excited, receive vague updates, and drift away—while a small leadership core carries everything.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <div className="notion-card p-6 sm:p-8 h-full">
                <h2 className="card-heading font-bold text-black">Our Solution</h2>
                <p className="mt-3 text-[16px] text-[#615d59] leading-[1.6]">
                  ClubConnect provides a unified platform for discovering clubs with honest time commitments, onboarding members step by step, distributing responsibilities visibly on Kanban boards, and recognizing contributions across tasks, events, and collaboration.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Design Thinking Horizontal 5-Stage Process */}
          <div className="mt-20">
            <div className="max-w-2xl mb-10">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-2">
                Methodology
              </p>
              <AnimatedHeadline
                text="Our Design Thinking approach."
                className="section-heading text-[32px] sm:text-[44px] font-bold text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {DESIGN_THINKING_STAGES.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <ScrollReveal key={item.stage} delay={idx * 0.06}>
                    <div className={`rounded-[12px] p-5 h-full flex flex-col justify-between ${item.bg}`}>
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`text-[12px] font-semibold ${item.sub}`}>
                            {item.stage}
                          </span>
                          <Icon className={`w-4 h-4 ${item.text}`} />
                        </div>
                        <h3 className={`text-[18px] font-bold leading-snug ${item.text}`}>
                          {item.title}
                        </h3>
                        <p className={`mt-2.5 text-[14px] leading-[1.5] ${item.sub}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" to="/clubs">
              Explore Clubs
            </Button>
            <Button variant="secondary" size="lg" to="/dashboard">
              Try Student Workspace
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};
