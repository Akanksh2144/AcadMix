from database import Base
from app.models.core import SoftDeleteMixin, College, Department, Section, Role, User, UserPermission, UserProfile, ParentStudentLink
from app.models.academics import Course, CourseEnrollment, Timetable, TimetableApproval, PeriodSlot, AcademicCalendar, CourseRegistration, RegistrationWindow, TeachingRecord, ClassInCharge, MentorAssignment, StudentProgression
from app.models.evaluation import Quiz, Question, Option, QuizAttempt, QuizAnswer, ProctoringEvent, ProctoringViolation, Appeal, MarkSubmission, MarkSubmissionEntry, SemesterGrade, StudentRanking, CIATemplate, CIATemplateComponent, SubjectCIAConfig, ExamSchedule, QuestionPaperSubmission, TeachingEvaluation, StudyMaterial, CodingChallenge, ChallengeProgress, PremiumCodingChallenge, PremiumChallengeProgress
from app.models.administration import FacultyAssignment, Announcement, AttendanceRecord, LeaveRequest, InstitutionProfile, StudentFeeInvoice, FeePayment, ActivityPermission, TaskAssignment, DepartmentMeeting, OutOfCampusPermission, FreePeriodRequest, Scholarship, ScholarshipApplication, CourseFeedback, Grievance, MOU, CurriculumFeedback, DHCircular, CircularAcknowledgment, DHSubmissionRequirement, DHSubmissionRecord, InspectionRecord, InspectionResponse, ExpertAssignment, NodalOfficerJurisdiction
from app.models.alumni_industry import Company, PlacementDrive, PlacementApplication, AlumniJobPosting, AlumniMentorship, AlumniEvent, AlumniEventRegistration, AlumniGuestLecture, AlumniContribution, AlumniAchievement, AlumniFeedback, IndustryProject, IndustryProjectApplication, EmployerFeedback, RetiredFacultyAdvisory, RetiredFacultyResearch, ConsultancyEngagement
from app.models.interview_prep import MockInterview, ResumeScore, StudentResume, PlacementRestriction
from app.models.hostel import RoomTemplate, Hostel, Room, Bed, Allocation, GatePass
from app.models.iot import BusRoute, BusLocation, VendingMachine, VendingTransaction, RewardPointLog, AIS140Device, TransportEnrollment, Trip, TripSummary, TransportAttendance
from app.models.audit import AuditLog, RLSShadowLog
from app.models.library import Book, BookCopy, LibraryTransaction, LibraryFine, LibraryReservation
from app.models.visitors import Visitor, VisitRecord
from app.models.notifications import Notification, PushSubscription
from app.models.admissions import Admission

from app.models.outcomes import ProgramOutcome, CourseOutcome, COPOMapping
from app.models.assessments import AIGeneratedAssessment, AssessmentQuestion
