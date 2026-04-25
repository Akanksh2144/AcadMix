"""Generate 25_subjects.csv - JNTUH R22 B.Tech subjects for all branches."""
import csv

# Common subjects (Sem 1 & 2 - all branches share these)
COMMON = {
    1: [
        ("22MA1101","Linear Algebra & Calculus","Theory","core",4,3,1,0),
        ("22PH1101","Applied Physics","Theory","core",4,3,0,0),
        ("22CS1101","Programming for Problem Solving (C)","Theory","core",3,3,0,0),
        ("22CS1102","Programming for Problem Solving Lab","Lab","core",1,0,0,3),
        ("22EN1101","English - I","Theory","aec",2,2,0,0),
        ("22ME1101","Engineering Drawing","Lab","core",2,1,0,2),
        ("22PH1102","Applied Physics Lab","Lab","core",1,0,0,2),
    ],
    2: [
        ("22MA1201","Probability, Statistics & Numerical Methods","Theory","core",4,3,1,0),
        ("22CH1201","Engineering Chemistry","Theory","core",4,3,0,0),
        ("22EE1201","Basic Electrical Engineering","Theory","core",3,3,0,0),
        ("22EE1202","Basic Electrical Engineering Lab","Lab","core",1,0,0,2),
        ("22EN1201","English - II","Theory","aec",2,2,0,0),
        ("22CS1201","Data Structures","Theory","core",3,3,0,0),
        ("22CS1202","Data Structures Lab","Lab","core",1,0,0,3),
        ("22CH1202","Engineering Chemistry Lab","Lab","core",1,0,0,2),
    ],
}

# Branch-specific subjects (Sem 3-8)
BRANCH_SUBJECTS = {
    "CSE": {
        3: [
            ("22CS3101","Discrete Mathematics","Theory","core",3,3,0,0),
            ("22CS3102","Object-Oriented Programming (Java)","Theory","core",3,3,0,0),
            ("22CS3103","Digital Logic Design","Theory","core",3,3,0,0),
            ("22CS3104","Computer Organization","Theory","core",3,3,0,0),
            ("22CS3105","OOP Lab","Lab","core",2,0,0,3),
            ("22CS3106","Digital Logic Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22CS4101","Operating Systems","Theory","core",3,3,0,0),
            ("22CS4102","Database Management Systems","Theory","core",3,3,0,0),
            ("22CS4103","Design & Analysis of Algorithms","Theory","core",3,3,1,0),
            ("22CS4104","Software Engineering","Theory","core",3,3,0,0),
            ("22CS4105","OS & DBMS Lab","Lab","core",2,0,0,3),
            ("22CS4106","Python Programming Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22CS5101","Computer Networks","Theory","core",3,3,0,0),
            ("22CS5102","Compiler Design","Theory","core",3,3,0,0),
            ("22CS5103","Formal Languages & Automata Theory","Theory","core",3,3,1,0),
            ("22CS5104","Web Technologies","Theory","core",3,2,0,2),
            ("22CS5105","Computer Networks Lab","Lab","core",2,0,0,3),
            ("22CS5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22CS6101","Artificial Intelligence","Theory","core",3,3,0,0),
            ("22CS6102","Cryptography & Network Security","Theory","core",3,3,0,0),
            ("22CS6103","Machine Learning","Theory","core",3,3,0,0),
            ("22CS6104","Cloud Computing","Theory","core",3,3,0,0),
            ("22CS6105","AI & ML Lab","Lab","core",2,0,0,3),
            ("22CS6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22CS6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22CS7101","Big Data Analytics","Theory","core",3,3,0,0),
            ("22CS7102","Internet of Things","Theory","core",3,3,0,0),
            ("22CS7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22CS7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22CS7105","Project - I","Lab","core",2,0,0,4),
            ("22CS7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22CS8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22CS8102","Project - II","Lab","core",8,0,0,16),
            ("22CS8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
    "IT": {
        3: [
            ("22IT3101","Discrete Mathematics","Theory","core",3,3,0,0),
            ("22IT3102","Object-Oriented Programming (Java)","Theory","core",3,3,0,0),
            ("22IT3103","Digital Logic Design","Theory","core",3,3,0,0),
            ("22IT3104","Computer Organization","Theory","core",3,3,0,0),
            ("22IT3105","OOP Lab","Lab","core",2,0,0,3),
            ("22IT3106","Digital Logic Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22IT4101","Operating Systems","Theory","core",3,3,0,0),
            ("22IT4102","Database Management Systems","Theory","core",3,3,0,0),
            ("22IT4103","Design & Analysis of Algorithms","Theory","core",3,3,1,0),
            ("22IT4104","Software Engineering","Theory","core",3,3,0,0),
            ("22IT4105","OS & DBMS Lab","Lab","core",2,0,0,3),
            ("22IT4106","Python Programming Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22IT5101","Computer Networks","Theory","core",3,3,0,0),
            ("22IT5102","Web Technologies","Theory","core",3,2,0,2),
            ("22IT5103","Information Security","Theory","core",3,3,0,0),
            ("22IT5104","Data Warehousing & Mining","Theory","core",3,3,0,0),
            ("22IT5105","CN & Web Lab","Lab","core",2,0,0,3),
            ("22IT5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22IT6101","Artificial Intelligence","Theory","core",3,3,0,0),
            ("22IT6102","Cloud Computing","Theory","core",3,3,0,0),
            ("22IT6103","Software Testing","Theory","core",3,3,0,0),
            ("22IT6104","Mobile Application Development","Theory","core",3,3,0,0),
            ("22IT6105","AI & Cloud Lab","Lab","core",2,0,0,3),
            ("22IT6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22IT6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22IT7101","DevOps & Automation","Theory","core",3,3,0,0),
            ("22IT7102","Blockchain Technology","Theory","core",3,3,0,0),
            ("22IT7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22IT7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22IT7105","Project - I","Lab","core",2,0,0,4),
            ("22IT7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22IT8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22IT8102","Project - II","Lab","core",8,0,0,16),
            ("22IT8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
    "ECE": {
        3: [
            ("22EC3101","Signals & Systems","Theory","core",3,3,1,0),
            ("22EC3102","Analog Electronics","Theory","core",3,3,0,0),
            ("22EC3103","Network Theory","Theory","core",3,3,1,0),
            ("22EC3104","Electromagnetic Theory","Theory","core",3,3,0,0),
            ("22EC3105","Analog Electronics Lab","Lab","core",2,0,0,3),
            ("22EC3106","Network Theory Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22EC4101","Analog Communication","Theory","core",3,3,0,0),
            ("22EC4102","Digital Signal Processing","Theory","core",3,3,1,0),
            ("22EC4103","Linear IC Applications","Theory","core",3,3,0,0),
            ("22EC4104","Control Systems","Theory","core",3,3,1,0),
            ("22EC4105","Communication & DSP Lab","Lab","core",2,0,0,3),
            ("22EC4106","IC Applications Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22EC5101","Digital Communication","Theory","core",3,3,0,0),
            ("22EC5102","VLSI Design","Theory","core",3,3,0,0),
            ("22EC5103","Microprocessors & Microcontrollers","Theory","core",3,3,0,0),
            ("22EC5104","Antenna & Wave Propagation","Theory","core",3,3,0,0),
            ("22EC5105","VLSI & Microprocessor Lab","Lab","core",2,0,0,3),
            ("22EC5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22EC6101","Wireless Communication","Theory","core",3,3,0,0),
            ("22EC6102","Embedded Systems","Theory","core",3,3,0,0),
            ("22EC6103","Radar & Satellite Communication","Theory","core",3,3,0,0),
            ("22EC6104","Digital Image Processing","Theory","core",3,3,0,0),
            ("22EC6105","Embedded Systems Lab","Lab","core",2,0,0,3),
            ("22EC6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22EC6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22EC7101","Optical Communication","Theory","core",3,3,0,0),
            ("22EC7102","Robotics","Theory","core",3,3,0,0),
            ("22EC7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22EC7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22EC7105","Project - I","Lab","core",2,0,0,4),
            ("22EC7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22EC8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22EC8102","Project - II","Lab","core",8,0,0,16),
            ("22EC8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
    "EEE": {
        3: [
            ("22EE3101","Electrical Machines - I","Theory","core",3,3,0,0),
            ("22EE3102","Network Theory","Theory","core",3,3,1,0),
            ("22EE3103","Electromagnetic Fields","Theory","core",3,3,0,0),
            ("22EE3104","Electronic Devices & Circuits","Theory","core",3,3,0,0),
            ("22EE3105","Electrical Machines Lab","Lab","core",2,0,0,3),
            ("22EE3106","Electronics Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22EE4101","Electrical Machines - II","Theory","core",3,3,0,0),
            ("22EE4102","Power Systems - I","Theory","core",3,3,0,0),
            ("22EE4103","Control Systems","Theory","core",3,3,1,0),
            ("22EE4104","Signals & Systems","Theory","core",3,3,1,0),
            ("22EE4105","Machines & Control Lab","Lab","core",2,0,0,3),
            ("22EE4106","Simulation Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22EE5101","Power Systems - II","Theory","core",3,3,0,0),
            ("22EE5102","Power Electronics","Theory","core",3,3,0,0),
            ("22EE5103","Microprocessors & Microcontrollers","Theory","core",3,3,0,0),
            ("22EE5104","Electrical Measurements","Theory","core",3,3,0,0),
            ("22EE5105","Power Electronics Lab","Lab","core",2,0,0,3),
            ("22EE5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22EE6101","Power System Protection","Theory","core",3,3,0,0),
            ("22EE6102","Renewable Energy Systems","Theory","core",3,3,0,0),
            ("22EE6103","Electric Drives","Theory","core",3,3,0,0),
            ("22EE6104","Digital Signal Processing","Theory","core",3,3,0,0),
            ("22EE6105","Drives & Renewable Lab","Lab","core",2,0,0,3),
            ("22EE6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22EE6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22EE7101","Smart Grid Technology","Theory","core",3,3,0,0),
            ("22EE7102","High Voltage Engineering","Theory","core",3,3,0,0),
            ("22EE7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22EE7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22EE7105","Project - I","Lab","core",2,0,0,4),
            ("22EE7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22EE8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22EE8102","Project - II","Lab","core",8,0,0,16),
            ("22EE8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
    "MECH": {
        3: [
            ("22ME3101","Thermodynamics","Theory","core",3,3,0,0),
            ("22ME3102","Mechanics of Solids","Theory","core",3,3,1,0),
            ("22ME3103","Manufacturing Technology","Theory","core",3,3,0,0),
            ("22ME3104","Fluid Mechanics","Theory","core",3,3,0,0),
            ("22ME3105","Manufacturing Lab","Lab","core",2,0,0,3),
            ("22ME3106","Fluid Mechanics Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22ME4101","Kinematics of Machinery","Theory","core",3,3,0,0),
            ("22ME4102","Thermal Engineering - I","Theory","core",3,3,0,0),
            ("22ME4103","Machine Design - I","Theory","core",3,3,1,0),
            ("22ME4104","Metrology & Quality Control","Theory","core",3,3,0,0),
            ("22ME4105","Thermal Engineering Lab","Lab","core",2,0,0,3),
            ("22ME4106","Metrology Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22ME5101","Dynamics of Machinery","Theory","core",3,3,0,0),
            ("22ME5102","Heat Transfer","Theory","core",3,3,0,0),
            ("22ME5103","Machine Design - II","Theory","core",3,3,0,0),
            ("22ME5104","Industrial Engineering","Theory","core",3,3,0,0),
            ("22ME5105","CAD/CAM Lab","Lab","core",2,0,0,3),
            ("22ME5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22ME6101","Automobile Engineering","Theory","core",3,3,0,0),
            ("22ME6102","Finite Element Methods","Theory","core",3,3,0,0),
            ("22ME6103","Robotics","Theory","core",3,3,0,0),
            ("22ME6104","Operations Research","Theory","core",3,3,0,0),
            ("22ME6105","Robotics & Simulation Lab","Lab","core",2,0,0,3),
            ("22ME6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22ME6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22ME7101","Power Plant Engineering","Theory","core",3,3,0,0),
            ("22ME7102","Refrigeration & Air Conditioning","Theory","core",3,3,0,0),
            ("22ME7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22ME7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22ME7105","Project - I","Lab","core",2,0,0,4),
            ("22ME7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22ME8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22ME8102","Project - II","Lab","core",8,0,0,16),
            ("22ME8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
    "CIVIL": {
        3: [
            ("22CE3101","Mechanics of Solids","Theory","core",3,3,1,0),
            ("22CE3102","Surveying","Theory","core",3,3,0,0),
            ("22CE3103","Building Materials & Construction","Theory","core",3,3,0,0),
            ("22CE3104","Fluid Mechanics","Theory","core",3,3,0,0),
            ("22CE3105","Surveying Lab","Lab","core",2,0,0,3),
            ("22CE3106","Fluid Mechanics Lab","Lab","core",1,0,0,2),
            ("22HS3101","Managerial Economics & Financial Analysis","Theory","sec",3,3,0,0),
        ],
        4: [
            ("22CE4101","Structural Analysis - I","Theory","core",3,3,1,0),
            ("22CE4102","Geotechnical Engineering - I","Theory","core",3,3,0,0),
            ("22CE4103","Hydraulics & Hydraulic Machinery","Theory","core",3,3,0,0),
            ("22CE4104","Concrete Technology","Theory","core",3,3,0,0),
            ("22CE4105","Geotechnical Lab","Lab","core",2,0,0,3),
            ("22CE4106","Concrete Lab","Lab","core",1,0,0,2),
            ("22HS4101","Environmental Science","Theory","mdc",2,2,0,0),
        ],
        5: [
            ("22CE5101","Structural Analysis - II","Theory","core",3,3,0,0),
            ("22CE5102","Design of RC Structures","Theory","core",3,3,0,0),
            ("22CE5103","Transportation Engineering","Theory","core",3,3,0,0),
            ("22CE5104","Environmental Engineering","Theory","core",3,3,0,0),
            ("22CE5105","RC Design Lab","Lab","core",2,0,0,3),
            ("22CE5106","Professional Elective - I","Theory","elective",3,3,0,0),
            ("22MC5101","Constitution of India","Theory","mdc",0,2,0,0),
        ],
        6: [
            ("22CE6101","Design of Steel Structures","Theory","core",3,3,0,0),
            ("22CE6102","Geotechnical Engineering - II","Theory","core",3,3,0,0),
            ("22CE6103","Hydrology & Water Resources","Theory","core",3,3,0,0),
            ("22CE6104","Estimation & Costing","Theory","core",3,3,0,0),
            ("22CE6105","Steel Structures Lab","Lab","core",2,0,0,3),
            ("22CE6106","Professional Elective - II","Theory","elective",3,3,0,0),
            ("22CE6107","Open Elective - I","Theory","open_elective",3,3,0,0),
        ],
        7: [
            ("22CE7101","Construction Planning & Management","Theory","core",3,3,0,0),
            ("22CE7102","Remote Sensing & GIS","Theory","core",3,3,0,0),
            ("22CE7103","Professional Elective - III","Theory","elective",3,3,0,0),
            ("22CE7104","Open Elective - II","Theory","open_elective",3,3,0,0),
            ("22CE7105","Project - I","Lab","core",2,0,0,4),
            ("22CE7106","Seminar","Lab","core",2,0,0,2),
        ],
        8: [
            ("22CE8101","Professional Elective - IV","Theory","elective",3,3,0,0),
            ("22CE8102","Project - II","Lab","core",8,0,0,16),
            ("22CE8103","Comprehensive Viva","Lab","core",2,0,0,0),
        ],
    },
}

# ET sub-branches share CSE core but have specialization subjects from sem 3
for branch, prefix in [("CSM","AI"),("CSD","DS"),("AIML","AM"),("CSO","CY"),("IoT","IO")]:
    BRANCH_SUBJECTS[branch] = {}
    for sem in range(3, 9):
        if sem in BRANCH_SUBJECTS["CSE"]:
            base = []
            for s in BRANCH_SUBJECTS["CSE"][sem]:
                code = s[0].replace("22CS", f"22{prefix}")
                base.append((code, s[1], s[2], s[3], s[4], s[5], s[6], s[7]))
            BRANCH_SUBJECTS[branch][sem] = base

# Department code mapping
DEPT_MAP = {
    "CSE":"dept-cse","IT":"dept-it","CSM":"dept-csm","CSD":"dept-csd",
    "CSO":"dept-cso","AIML":"dept-aiml","IoT":"dept-iot",
    "ECE":"dept-ece","EEE":"dept-eee","MECH":"dept-mech","CIVIL":"dept-civil"
}

rows = []
sid = 0
for branch, semesters in BRANCH_SUBJECTS.items():
    dept_id = DEPT_MAP[branch]
    # Sem 1 & 2 are common
    for sem in [1, 2]:
        for code, name, stype, cat, credits, l, t, p in COMMON[sem]:
            sid += 1
            rows.append({
                "id": f"subj-{sid:04d}",
                "subject_code": code,
                "name": name,
                "dept_id": dept_id,
                "dept_code": branch,
                "semester": sem,
                "type": stype,
                "course_category": cat,
                "credits": credits,
                "lecture_hrs": l,
                "tutorial_hrs": t,
                "practical_hrs": p,
                "regulation": "R22",
                "hours_per_week": l + t + p,
                "is_mooc": False,
            })
    # Branch-specific
    for sem, subjects in semesters.items():
        for code, name, stype, cat, credits, l, t, p in subjects:
            sid += 1
            rows.append({
                "id": f"subj-{sid:04d}",
                "subject_code": code,
                "name": name,
                "dept_id": dept_id,
                "dept_code": branch,
                "semester": sem,
                "type": stype,
                "course_category": cat,
                "credits": credits,
                "lecture_hrs": l,
                "tutorial_hrs": t,
                "practical_hrs": p,
                "regulation": "R22",
                "hours_per_week": l + t + p,
                "is_mooc": False,
            })

fields = ["id","subject_code","name","dept_id","dept_code","semester","type",
          "course_category","credits","lecture_hrs","tutorial_hrs","practical_hrs",
          "regulation","hours_per_week","is_mooc"]

with open("25_subjects.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

print(f"Generated 25_subjects.csv with {len(rows)} subjects")
