import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Student, Chalkboard, Crown, Buildings, Briefcase,
  UserCircleGear, UsersThree, ShieldStar, GraduationCap,
  Factory, HouseLine, Certificate
} from '@phosphor-icons/react';

const roles = [
  {
    id: 'student',
    icon: Student,
    name: 'Student',
    color: 'var(--teal)',
    desc: 'Take proctored quizzes, view results, track performance analytics, access AI career tools, book hostel rooms, and prepare for placements.',
    features: ['Proctored Quiz Taking', 'Performance Analytics', 'AI Mock Interviews', 'Resume ATS Scorer', 'Hostel Booking', 'Semester Results'],
  },
  {
    id: 'teacher',
    icon: Chalkboard,
    name: 'Faculty',
    color: 'var(--indigo)',
    desc: 'Create quizzes with 4 question types, enter CIA marks, view class-wise results, manage attendance, and track teaching records.',
    features: ['Quiz Builder', 'Marks Entry & Approval', 'Class Results', 'Attendance Marking', 'Code Playground', 'Teaching Records'],
  },
  {
    id: 'hod',
    icon: Crown,
    name: 'HOD',
    color: 'var(--amber)',
    desc: 'Manage department faculty, review and approve marks, handle student management, and access department-level analytics.',
    features: ['Mark Reviews & Approval', 'Faculty Management', 'Student Management', 'Department Analytics', 'Section Management', 'Revision Tracking'],
  },
  {
    id: 'principal',
    icon: ShieldStar,
    name: 'Principal',
    color: 'var(--purple)',
    desc: 'College-wide oversight with institution-level analytics, department comparisons, faculty performance, and strategic dashboards.',
    features: ['Institution Analytics', 'Department Comparison', 'Faculty Performance', 'Enrollment Trends', 'Result Overview', 'Policy Management'],
  },
  {
    id: 'tpo',
    icon: Briefcase,
    name: 'T&P Officer',
    color: 'var(--emerald)',
    desc: 'Manage campus drives, coordinate with industry partners, track placement stats, and monitor student placement readiness.',
    features: ['Campus Drive Management', 'Industry Coordination', 'Placement Statistics', 'Student Readiness', 'Company Database', 'Offer Tracking'],
  },
  {
    id: 'admin',
    icon: UserCircleGear,
    name: 'Admin',
    color: 'var(--rose)',
    desc: 'System-wide configuration, user management, college metrics, multi-tenant setup, and platform-level analytics.',
    features: ['User Management', 'College Metrics', 'System Configuration', 'Multi-Tenant Setup', 'Platform Analytics', 'Access Control'],
  },
  {
    id: 'parent',
    icon: UsersThree,
    name: 'Parent',
    color: 'var(--indigo)',
    desc: 'Track ward\'s academic progress, view attendance records, fee status, and receive notifications about performance.',
    features: ['Academic Progress', 'Attendance Tracking', 'Fee Management', 'Performance Alerts', 'Communication', 'Report Cards'],
  },
  {
    id: 'industry',
    icon: Factory,
    name: 'Industry Partner',
    color: 'var(--teal)',
    desc: 'Post job openings, schedule campus drives, review student profiles, and manage recruitment pipelines.',
    features: ['Job Posting', 'Campus Scheduling', 'Student Profiles', 'Recruitment Pipeline', 'Interview Scheduling', 'Offer Management'],
  },
  {
    id: 'warden',
    icon: HouseLine,
    name: 'Warden',
    color: 'var(--amber)',
    desc: 'Manage hostel allocations, handle complaints, track room inventory, and oversee mess management.',
    features: ['Room Allocation', 'Complaint Management', 'Inventory Tracking', 'Mess Management', 'Visitor Logs', 'Maintenance Requests'],
  },
  {
    id: 'alumni',
    icon: GraduationCap,
    name: 'Alumni',
    color: 'var(--purple)',
    desc: 'Stay connected with alma mater, mentor students, share job referrals, and participate in college events.',
    features: ['Mentor Students', 'Job Referrals', 'Event Participation', 'Network Directory', 'Success Stories', 'Guest Lectures'],
  },
  {
    id: 'examcell',
    icon: Certificate,
    name: 'Exam Cell',
    color: 'var(--emerald)',
    desc: 'Manage end-term marks, publish results, handle hall tickets, and coordinate examination schedules.',
    features: ['End-term Marks Upload', 'Result Publication', 'Hall Tickets', 'Exam Scheduling', 'Grade Computation', 'Transcript Generation'],
  },
  {
    id: 'nodal',
    icon: Buildings,
    name: 'Nodal Officer',
    color: 'var(--rose)',
    desc: 'Government oversight dashboard with multi-college comparison, regulatory compliance tracking, and policy monitoring.',
    features: ['Multi-College Oversight', 'Compliance Tracking', 'Policy Monitoring', 'Data Aggregation', 'Regulatory Reports', 'College Rankings'],
  },
];

const RoleShowcase = () => {
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-100px' });

  return (
    <section id="roles" className="section">
      <div className="container">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <span className="badge badge-purple" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            Role-Based Access
          </span>
          <h2 className="section-title">
            One platform,{' '}
            <span className="text-gradient">every stakeholder</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Each role gets a tailored dashboard designed for their specific workflow. No clutter, no confusion.
          </p>
        </motion.div>

        {/* Role selector pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '.5rem',
          justifyContent: 'center',
          marginBottom: '2.5rem',
        }}>
          {roles.map(role => (
            <motion.button
              key={role.id}
              onClick={() => setSelectedRole(role)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.375rem',
                padding: '.5rem 1rem',
                borderRadius: 999,
                fontSize: '.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .2s',
                background: selectedRole.id === role.id
                  ? `rgba(${role.color}, .15)`
                  : 'rgba(var(--surface), .6)',
                color: selectedRole.id === role.id
                  ? `rgb(${role.color})`
                  : 'rgb(var(--text-secondary))',
                border: `1px solid ${selectedRole.id === role.id
                  ? `rgba(${role.color}, .3)`
                  : 'rgba(var(--border), .4)'}`,
              }}
            >
              <role.icon size={16} weight="duotone" />
              {role.name}
            </motion.button>
          ))}
        </div>

        {/* Role detail card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
            style={{
              maxWidth: 900,
              margin: '0 auto',
              padding: '2.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem',
            }}
          >
            <div>
              {/* Role header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: 'var(--radius-lg)',
                  background: `rgba(${selectedRole.color}, .1)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid rgba(${selectedRole.color}, .2)`,
                }}>
                  <selectedRole.icon size={32} weight="duotone" style={{ color: `rgb(${selectedRole.color})` }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {selectedRole.name} Dashboard
                  </h3>
                  <span style={{
                    fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '.08em', color: `rgb(${selectedRole.color})`,
                  }}>
                    Dedicated Portal
                  </span>
                </div>
              </div>

              <p style={{
                fontSize: '1rem',
                color: 'rgb(var(--text-secondary))',
                lineHeight: 1.7,
                marginBottom: '1.5rem',
              }}>
                {selectedRole.desc}
              </p>

              {/* Features grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
                {selectedRole.features.map((feat, i) => (
                  <motion.div
                    key={feat}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.625rem',
                      padding: '.75rem 1rem',
                      borderRadius: 'var(--radius)',
                      background: `rgba(${selectedRole.color}, .04)`,
                      border: `1px solid rgba(${selectedRole.color}, .08)`,
                      fontSize: '.875rem',
                      fontWeight: 500,
                      color: 'rgb(var(--text))',
                    }}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: `rgb(${selectedRole.color})`,
                      flexShrink: 0,
                    }} />
                    {feat}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default RoleShowcase;
