import sys, re

with open('c:/AcadMix/backend/models.py', 'r', encoding='utf-8') as f:
    code = f.read()

new_model = """class ActivityPermission(Base, SoftDeleteMixin):
    __tablename__ = "activity_permissions"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    activity_type = Column(String, nullable=False) # Enum: remedial, career_counselling, study_visit, seminar, sports, cultural, ncc, nss
    phase = Column(String, nullable=False, server_default='permission') # Enum: permission, post_event
    
    event_title = Column(String, nullable=False)
    event_date = Column(Date, nullable=False)
    event_details = Column(JSONB, nullable=True)
    
    hod_permission_decision = Column(String, nullable=True) # pending, approved, rejected
    hod_permission_notes = Column(String, nullable=True)
    hod_permission_decided_at = Column(DateTime(timezone=True), nullable=True)
    
    hod_report_decision = Column(String, nullable=True) # pending, accepted, rejected, revision_needed
    hod_report_notes = Column(String, nullable=True)
    hod_report_decided_at = Column(DateTime(timezone=True), nullable=True)
    
    principal_noted_at = Column(DateTime(timezone=True), nullable=True)
    principal_notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
"""

start_idx = code.find('class ActivityPermission(Base, SoftDeleteMixin):')
next_class_idx = code.find('class TaskAssignment(Base, SoftDeleteMixin):')

if start_idx != -1 and next_class_idx != -1:
    new_code = code[:start_idx] + new_model + '\n' + code[next_class_idx:]
    with open('c:/AcadMix/backend/models.py', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Patched!")
else:
    print("Could not find class markers")
