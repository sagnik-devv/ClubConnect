import React from 'react';
import { AnimatedHeadline } from '../animations/AnimatedHeadline';
import { ScrollReveal } from '../animations/ScrollReveal';
import { HandArrowDoodle } from '../common/CharacterMarks';

const STEPS = [
  {
    num: '01',
    title: 'Discover a club.',
    desc: 'Browse communities by skills, interests, and real weekly time commitments.',
    pillBg: '#e6f3fe',
  },
  {
    num: '02',
    title: 'Join and complete onboarding.',
    desc: 'Apply transparently, meet your team buddy, and finish a guided 6-step welcome.',
    pillBg: '#f6d5b8',
  },
  {
    num: '03',
    title: 'Participate and take on responsibilities.',
    desc: 'Pick up starter tasks on the board and collaborate across events and projects.',
    pillBg: '#ffb110',
  },
  {
    num: '04',
    title: 'Track contributions and grow.',
    desc: 'Build a clear record of projects shipped, events supported, and teamwork.',
    pillBg: '#62aef0',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 border-t border-black/[0.08]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-3">
              How It Works
            </p>
            <AnimatedHeadline
              text="From curious newcomer to steady contributor."
              className="section-heading text-[34px] sm:text-[46px] lg:text-[54px] font-bold text-black"
            />
          </div>
          <HandArrowDoodle className="w-12 h-9 hidden md:block text-black/40" />
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, idx) => (
            <ScrollReveal key={step.num} delay={idx * 0.08}>
              <div className="notion-card p-6 h-full flex flex-col justify-between">
                <div>
                  <span
                    style={{ backgroundColor: step.pillBg }}
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-semibold text-black mb-5"
                  >
                    Step {step.num}
                  </span>
                  <h3 className="card-heading font-bold text-black">{step.title}</h3>
                  <p className="mt-2.5 text-[15px] text-[#615d59] leading-[1.5]">
                    {step.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
