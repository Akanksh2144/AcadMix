import React from 'react';
import { useTheme } from './hooks/useTheme';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import RoleShowcase from './components/RoleShowcase';
import Stats from './components/Stats';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';
import './index.css';

function App() {
  const { isDark, toggle } = useTheme();

  return (
    <>
      <Navbar isDark={isDark} toggleTheme={toggle} />
      <main>
        <Hero />
        <Features />
        <Stats />
        <RoleShowcase />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export default App;
