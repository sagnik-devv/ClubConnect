import React from 'react';
import { Compass, Layers, Award, Users, FileCheck, Scale } from 'lucide-react';
import { AnimatedHeadline } from '../animations/AnimatedHeadline';
import { ScrollReveal } from '../animations/ScrollReveal';

const FEATURES = [
  {
    title: 'Discover Clubs',
    description:
      'Filter by interests, open roles, and weekly hours so you join communities that genuinely match your schedule.',
    icon: Compass,
    bg: 'bg-white border border-black/[0.08]',
    text: 'text-black',
    sub: 'text-[#615d59]',
    iconBg: 'bg-[#e6f3fe] text-[#0075de]',
  },
  {
    title: 'Smart Task Allocation',
    description:
      'Break big semester events into scoped, bite-sized responsibilities that new and senior members can share.',
    icon: Layers,
    bg: 'bg-[#ffb110]',
    text: 'text-black',
    sub: 'text-black/80',
    iconBg: 'bg-white/90 text-black',
  },
  {
    title: 'Contribution Tracking',
    description:
      'Capture tasks shipped, events supported, and team collaborations—without reducing growth to one arbitrary score.',
    icon: Award,
    bg: 'bg-white border border-black/[0.08]',
    text: 'text-black',
    sub: 'text-[#615d59]',
    iconBg: 'bg-[#f6d5b8] text-black',
  },
  {
    title: 'Member Engagement',
    description:
      'Spot quiet members early with supportive check-in prompts and low-barrier starter tasks.',
    icon: Users,
    bg: 'bg-[#62aef0]',
    text: 'text-black',
    sub: 'text-black/85',
    iconBg: 'bg-white text-black',
  },
  {
    title: 'Transparent Recruitment',
    description:
      'Show real expectations, time commitments, and a clear 6-step onboarding path before students apply.',
    icon: FileCheck,
    bg: 'bg-[#02093a]',
    text: 'text-white',
    sub: 'text-white/80',
    iconBg: 'bg-white/15 text-white',
  },
  {
    title: 'Workload Management',
    description:
      'Visualize task counts across every member so club presidents spot uneven loads and prevent burnout.',
    icon: Scale,
    bg: 'bg-[#f64932]',
    text: 'text-white',
    sub: 'text-white/90',
    iconBg: 'bg-white/20 text-white',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 border-t border-black/[0.08]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-3">
            Built for Real Campus Teams
          </p>
          <AnimatedHeadline
            text="Everything your club needs to work better together."
            className="section-heading text-[34px] sm:text-[46px] lg:text-[54px] font-bold text-black"
          />
          <p className="mt-4 text-[18px] text-[#615d59] font-editorial max-w-2xl">
            From transparent discovery to balanced execution—designed like a calm notebook for student communities.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={feat.title} delay={idx * 0.06}>
                <div
                  className={`rounded-[12px] p-6 h-full transition-transform duration-200 hover:-translate-y-0.5 ${feat.bg}`}
                >
                  <div
                    className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-5 ${feat.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`card-heading font-bold ${feat.text}`}>{feat.title}</h3>
                  <p className={`mt-2.5 text-[16px] leading-[1.5] ${feat.sub}`}>
                    {feat.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
