import React from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Hero } from '../components/landing/Hero';
import { ProblemSection } from '../components/landing/ProblemSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FinalCTA } from '../components/landing/FinalCTA';

export const LandingPage: React.FC = () => {
  return (
    <MainLayout>
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorks />
      <FinalCTA />
    </MainLayout>
  );
};
