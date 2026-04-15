import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quotes, Star } from '@phosphor-icons/react';

const testimonials = [
  {
    name: 'Dr. Rajesh Kumar',
    role: 'Principal, GNITC',
    text: 'AcadMix transformed how we manage our entire academic workflow. The multi-tenant architecture means each department operates independently while we get a unified view.',
    avatar: 'RK',
    color: 'var(--indigo)',
  },
  {
    name: 'Prof. Anitha Sharma',
    role: 'HOD - Computer Science',
    text: "The marks approval workflow alone saved us 20+ hours per semester. The faculty can enter, I review, and it's all tracked with revision history. Brilliant.",
    avatar: 'AS',
    color: 'var(--purple)',
  },
  {
    name: 'Siddharth Nair',
    role: 'Student, CSE 3rd Year',
    text: 'The AI mock interview feature and resume ATS scorer helped me prepare for placements like nothing else. I secured my dream offer through a campus drive managed entirely on AcadMix.',
    avatar: 'SN',
    color: 'var(--teal)',
  },
  {
    name: 'Mrs. Padma Reddy',
    role: 'T&P Officer',
    text: 'Managing 15+ campus drives with 200+ companies was chaos before AcadMix. Now I have a dedicated dashboard with real-time placement statistics and automated scheduling.',
    avatar: 'PR',
    color: 'var(--emerald)',
  },
  {
    name: 'Dr. Venkat Rao',
    role: 'Exam Controller',
    text: 'The AI proctoring caught irregularities we would have never noticed manually. Combined with the end-term marks upload, our examination cell runs almost autonomously now.',
    avatar: 'VR',
    color: 'var(--amber)',
  },
  {
    name: 'Meera Patel',
    role: 'Parent',
    text: "I can track my child's attendance, marks, and even hostel status from a single dashboard. The performance alerts give me peace of mind knowing they're on track.",
    avatar: 'MP',
    color: 'var(--rose)',
  },
];

const TestimonialCard = ({ testimonial, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      className="glass-card"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: '.125rem' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} weight="fill" style={{ color: 'rgb(var(--amber))' }} />
        ))}
      </div>

      {/* Quote */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Quotes size={28} weight="fill" style={{
          color: `rgba(${testimonial.color}, .15)`,
          position: 'absolute',
          top: '-4px', left: '-4px',
        }} />
        <p style={{
          fontSize: '.925rem',
          color: 'rgb(var(--text-secondary))',
          lineHeight: 1.75,
          paddingLeft: '.5rem',
        }}>
          "{testimonial.text}"
        </p>
      </div>

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', paddingTop: '.5rem', borderTop: '1px solid rgba(var(--border), .2)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, rgba(${testimonial.color}, .2), rgba(${testimonial.color}, .1))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.8rem', fontWeight: 700, color: `rgb(${testimonial.color})`,
          border: `1px solid rgba(${testimonial.color}, .2)`,
        }}>
          {testimonial.avatar}
        </div>
        <div>
          <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'rgb(var(--text))' }}>
            {testimonial.name}
          </div>
          <div style={{ fontSize: '.75rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>
            {testimonial.role}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials = () => {
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-100px' });

  return (
    <section className="section">
      <div className="container">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <span className="badge badge-teal" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            Testimonials
          </span>
          <h2 className="section-title">
            Trusted by{' '}
            <span className="text-gradient">educators & students</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Hear from the people who use AcadMix every day to transform their academic experience.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}>
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
