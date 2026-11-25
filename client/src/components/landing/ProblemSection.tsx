import React from 'react';
import { AnimatedHeadline } from '../animations/AnimatedHeadline';
import { ScrollReveal } from '../animations/ScrollReveal';

const PROBLEMS = [
  {
    title: 'Silent Members',
    description: 'Students join clubs but gradually stop participating.',
    detail:
      'Without clear starter tasks or low-pressure check-ins, enthusiastic signups fade after the first general meeting.',
    illustration: (
      <svg viewBox="0 0 80 56" className="w-20 h-14" aria-hidden="true">
        <circle cx="24" cy="28" r="14" fill="#e6f3fe" stroke="#000" strokeWidth="1.6" />
        <circle cx="20" cy="26" r="1.4" fill="#000" />
        <circle cx="28" cy="26" r="1.4" fill="#000" />
        <line x1="20" y1="33" x2="28" y2="33" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="54" cy="28" r="14" fill="#f6f5f4" stroke="#000" strokeWidth="1.4" strokeDasharray="3 3" />
        <text x="54" y="32" textAnchor="middle" fontSize="12" fill="#757575">...</text>
      </svg>
    ),
  },
  {
    title: 'Overloaded Leaders',
    description: 'A small group of dedicated members ends up handling most responsibilities.',
    detail:
      'Presidents and core leads juggle events, logistics, and follow-ups alone because workload visibility does not exist.',
    illustration: (
      <svg viewBox="0 0 80 56" className="w-20 h-14" aria-hidden="true">
        <rect x="14" y="10" width="52" height="10" rx="4" fill="#ffb110" stroke="#000" strokeWidth="1.5" />
        <rect x="18" y="23" width="44" height="10" rx="4" fill="#f64932" stroke="#000" strokeWidth="1.5" />
        <rect x="22" y="36" width="36" height="10" rx="4" fill="#f6d5b8" stroke="#000" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Expectation Gap',
    description: 'Students sometimes discover that the actual club experience differs from what recruitment promised.',
    detail:
      'Vague club flyers hide real weekly time commitments, skills required, and day-to-day responsibilities.',
    illustration: (
      <svg viewBox="0 0 80 56" className="w-20 h-14" aria-hidden="true">
        <rect x="10" y="14" width="24" height="28" rx="5" fill="#e6f3fe" stroke="#000" strokeWidth="1.5" />
        <rect x="46" y="14" width="24" height="28" rx="5" fill="#ffb110" stroke="#000" strokeWidth="1.5" />
        <path d="M36 28 H44" stroke="#000" strokeWidth="1.6" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 border-t border-black/[0.08]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-[#757575] mb-3">
            Why Campus Clubs Stall
          </p>
          <AnimatedHeadline
            text="Joining a club is easy. Staying involved is the real challenge."
            className="section-heading text-[34px] sm:text-[46px] lg:text-[54px] font-bold text-black"
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((item, idx) => (
            <ScrollReveal key={item.title} delay={idx * 0.08}>
              <article className="notion-card p-6 h-full flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
                <div>
                  <div className="mb-5">{item.illustration}</div>
                  <h3 className="card-heading font-bold text-black">{item.title}</h3>
                  <p className="mt-2.5 text-[16px] font-medium text-black/85 leading-[1.5]">
                    {item.description}
                  </p>
                  <p className="mt-2.5 text-[14px] text-[#615d59] leading-[1.5]">
                    {item.detail}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
