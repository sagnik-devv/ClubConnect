import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { RotatingWords } from '../animations/RotatingWords';
import { RevealText } from '../animations/RevealText';
import { FloatingMarks } from '../common/FloatingMarks';
import {
  AvatarCharacterMark,
  FlowerDoodle,
  HERO_CHARACTERS,
  SparkleDoodle,
  SquiggleDoodle,
} from '../common/CharacterMarks';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { userService } from '../../services/user.service';
import { clubService } from '../../services/club.service';
import { useAuth } from '../../context/AuthContext';

export const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();

  const { data: platform } = useQuery({
    queryKey: ['platform-summary'],
    queryFn: userService.getPlatformSummary,
  });

  const { data: clubsData } = useQuery({
    queryKey: ['clubs-hero-preview'],
    queryFn: () => clubService.listClubs({ limit: 4 }),
  });

  const clubs = clubsData?.items ?? [];

  return (
    <section className="relative overflow-hidden bg-[#f6f5f4] pt-12 pb-20 sm:pt-16 lg:pt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="hidden lg:block pointer-events-none" aria-hidden="true">
          <FloatingMarks className="absolute left-12 top-24" amplitude={7} duration={4.8}>
            <SparkleDoodle color="#ffb110" className="w-8 h-8" />
          </FloatingMarks>
          <FloatingMarks className="absolute right-14 top-28" amplitude={6} duration={5.2} delay={0.4}>
            <FlowerDoodle color="#f64932" className="w-9 h-9" />
          </FloatingMarks>
          <FloatingMarks className="absolute left-20 top-72" amplitude={5} duration={4.1} delay={0.2}>
            <SquiggleDoodle color="#097fe8" className="w-14 h-6" />
          </FloatingMarks>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-7">
            {HERO_CHARACTERS.map((spec, idx) => (
              <AvatarCharacterMark
                key={spec.id}
                spec={spec}
                size={44}
                delay={idx * 0.05}
                className={idx === 0 || idx === 6 ? 'hidden sm:flex' : 'flex'}
              />
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.08] px-3.5 py-1 text-[12px] font-medium text-[#615d59] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#0075de]" />
            <RevealText text="Make campus life count." mode="char" />
          </div>

          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="hero-headline text-[42px] sm:text-[62px] lg:text-[78px] xl:text-[88px] font-bold text-black tracking-[-0.045em]"
          >
            Make your time outside class more{' '}
            <span className="inline-block mt-1 sm:mt-0">
              <RotatingWords />
            </span>
            <span className="text-black">.</span>
          </motion.h1>

          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-2xl mx-auto text-[17px] sm:text-[19px] text-[#615d59] font-editorial leading-[1.56]"
          >
            Find your community, discover your interests, take on meaningful responsibilities, and make every contribution count.
          </motion.p>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button variant="primary" size="lg" to="/clubs">
              Explore Clubs
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="lg" to={isAuthenticated ? '/dashboard' : '/register'}>
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            </Button>
          </motion.div>
        </div>

        {/* Live Platform Preview Window */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 max-w-6xl mx-auto"
        >
          <div className="rounded-[12px] bg-white border border-black/10 notion-mockup-shadow overflow-hidden">
            <div className="px-4 py-3 bg-[#f6f5f4] border-b border-black/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f64932]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb110]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#62aef0]" />
                <span className="ml-3 text-[12px] font-medium text-[#615d59]">
                  ClubConnect · Live Campus Workspace
                </span>
              </div>
              <Badge variant="blue">PostgreSQL Connected</Badge>
            </div>

            <div className="p-6 space-y-6">
              {/* Real Platform Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-[10px] border border-black/[0.08] p-4 bg-[#f6f5f4]">
                  <div className="text-[12px] text-[#615d59]">Active Clubs</div>
                  <div className="mt-1 text-[24px] font-bold text-black">
                    {platform?.clubsCount ?? 0}
                  </div>
                </div>
                <div className="rounded-[10px] border border-black/[0.08] p-4 bg-[#e6f3fe]">
                  <div className="text-[12px] text-[#0075de] font-medium">Active Memberships</div>
                  <div className="mt-1 text-[24px] font-bold text-black">
                    {platform?.activeMembershipsCount ?? 0}
                  </div>
                </div>
                <div className="rounded-[10px] border border-black/[0.08] p-4 bg-[#f6d5b8]/60">
                  <div className="text-[12px] text-[#615d59]">Upcoming Events</div>
                  <div className="mt-1 text-[24px] font-bold text-black">
                    {platform?.upcomingEventsCount ?? 0}
                  </div>
                </div>
                <div className="rounded-[10px] border border-black/[0.08] p-4 bg-[#ffb110]/20">
                  <div className="text-[12px] text-[#615d59]">Verified Contributions</div>
                  <div className="mt-1 text-[24px] font-bold text-black">
                    {platform?.verifiedContributionsCount ?? 0}
                  </div>
                </div>
              </div>

              {/* Real Clubs Directory Preview */}
              <div className="rounded-[10px] border border-black/[0.08] p-4 bg-[#faf9f8]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-semibold text-black flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0075de]" />
                    Active Campus Communities
                  </span>
                  <Button variant="ghost" size="sm" to="/clubs">
                    Browse all
                  </Button>
                </div>

                {clubs.length === 0 ? (
                  <div className="p-6 text-center rounded-[8px] bg-white border border-dashed border-black/15">
                    <p className="text-[14px] font-medium text-black">
                      No clubs created yet in this workspace.
                    </p>
                    <p className="mt-1 text-[13px] text-[#615d59]">
                      Register an account and create the first club to start inviting members.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {clubs.map((club) => (
                      <div
                        key={club.id}
                        className="p-3.5 rounded-[8px] bg-white border border-black/[0.08] flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-[#757575]">
                              {club.category}
                            </span>
                            <Badge variant={club.isRecruiting ? 'blue' : 'neutral'}>
                              {club.isRecruiting ? 'Recruiting' : 'Closed'}
                            </Badge>
                          </div>
                          <div className="mt-1 text-[14px] font-semibold text-black truncate">
                            {club.name}
                          </div>
                          <p className="mt-1 text-[12px] text-[#615d59] line-clamp-2">
                            {club.shortDescription}
                          </p>
                        </div>
                        <div className="text-[11px] text-[#615d59] flex items-center justify-between pt-1 border-t border-black/[0.06]">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#0075de]" />
                            {club.memberCount} members
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {club.upcomingEventsCount ?? 0} events
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
