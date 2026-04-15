import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Exam, ChartLineUp, Briefcase, Buildings,
  ClipboardText, Robot, ShieldCheck, UsersThree
} from '@phosphor-icons/react';

const features = [
  {
    icon: Exam,
    title: 'Quiz & Exam Engine',
    description: 'AI-proctored exams with MCQ, coding, and short-answer questions. Real-time monitoring, auto-grading, and anti-cheat telemetry.',
    color: 'var(--indigo)',
    tag: 'AI-Proctored',
  },
  {
    icon: ChartLineUp,
    title: 'Results & Analytics',
    description: 'Department-wise, section-wise, and student-level analytics with interactive charts. Track performance trends over semesters.',
    color: 'var(--emerald)',
    tag: 'Real-time',
  },
  {
    icon: Briefcase,
    title: 'Placement Management',
    description: 'ATS resume scoring, mock AI interviews, campus drive tracking, and industry partner portal. Complete T&P automation.',
    color: 'var(--purple)',
    tag: 'AI-Powered',
  },
  {
    icon: Buildings,
    title: 'Hostel Management',
    description: 'Room booking, hostel allocation, warden dashboards, complaint tracking, and mess management — all in one module.',
    color: 'var(--teal)',
    tag: 'Integrated',
  },
  {
    icon: ClipboardText,
    title: 'Attendance & Marks',
    description: 'CIA marks entry with approval workflows, mid-term/end-term management, and automated grade calculation with revision tracking.',
    color: 'var(--amber)',
    tag: 'Workflow',
  },
  {
    icon: Robot,
    title: 'AI Career Toolkit',
    description: 'Ami — your AI assistant for resume building, interview prep, career path guidance, skill gap analysis, and job matching.',
    color: 'var(--rose)',
    tag: 'Ami AI',
  },
  {
    icon: UsersThree,
    title: 'Role-Based Access',
    description: 'Student, Faculty, HOD, Principal, TPO, Admin, Parent, Alumni, Industry, Warden, Exam Cell, and more — each with tailored dashboards.',
    color: 'var(--indigo)',
    tag: '14 Roles',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-Tenant Security',
    description: 'Each college gets its own subdomain with isolated data. Row-level security, JWT auth, and configurable RBAC policies.',
    color: 'var(--emerald)',
    tag: 'Enterprise',
  },
];

const FeatureCard = ({ feature, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, type: 'spring', stiffness: 100 }}
      className="glass-card"
      style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow accent */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: 120, height: 120,
        background: `radial-gradient(circle, rgba(${feature.color}, .08), transparent 70%)`,
        borderRadius: '50%',
        transform: 'translate(30%, -30%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon + Tag row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 'var(--radius)',
            background: `rgba(${feature.color}, .1)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(${feature.color}, .15)`,
          }}>
            <feature.icon size={26} weight="duotone" style={{ color: `rgb(${feature.color})` }} />
          </div>
          <span style={{
            fontSize: '.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: `rgb(${feature.color})`,
            background: `rgba(${feature.color}, .08)`,
            padding: '.25rem .625rem',
            borderRadius: 999,
            border: `1px solid rgba(${feature.color}, .15)`,
          }}>
            {feature.tag}
          </span>
        </div>

        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'rgb(var(--text))',
          marginBottom: '.625rem',
          letterSpacing: '-0.01em',
        }}>
          {feature.title}
        </h3>

        <p style={{
          fontSize: '.9rem',
          color: 'rgb(var(--text-secondary))',
          lineHeight: 1.65,
        }}>
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};

const Features = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-100px' });

  return (
    <section id="features" className="section" style={{ position: 'relative' }}>
      <div className="gradient-bg" style={{ opacity: .5 }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <span className="badge badge-teal" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            Platform Features
          </span>
          <h2 className="section-title">
            Everything your college needs,{' '}
            <span className="text-gradient">in one platform</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            From AI-proctored exams to placement automation — AcadMix replaces 8+ separate tools with one unified, intelligent platform.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
