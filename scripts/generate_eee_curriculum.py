import json
import uuid
import random
import os

CATEGORIES = ["embedded"] # Focusing only on embedded for now
DOMAINS = ["Electric Vehicles", "Renewable Energy", "Smart Grid", "Industrial Automation", "HVAC Systems", "Robotics", "Traction Systems", "Aerospace Power"]
COMPANIES = ["Tesla", "Schneider Electric", "Siemens", "ABB", "Texas Instruments", "Ather Energy", "Bosch", "General Electric", "Eaton", "Cummins", "Rivian", "Lucid Motors"]

COMPONENTS = {
    "embedded": [
        "Battery Management System (BMS)", "Field Oriented Control (FOC)", "Space Vector PWM (SVPWM)", 
        "Maximum Power Point Tracking (MPPT)", "Digital Protective Relay", "Grid Synchronization (PLL)", 
        "Active Cell Balancing", "SoC Estimator", "SoH Estimator", "Motor Over-current Protection", 
        "EV Charge Controller (CCS)", "DC-DC Converter Firmware", "Three-Phase Inverter Firmware", 
        "Synchronous Rectification Logic", "Resolver to Digital Converter", "Hall Sensor Commutation", 
        "Sensorless Back-EMF Observer", "Smart Meter IEC 61850", "Anti-Islanding Protection", 
        "Regenerative Braking Controller", "Pre-charge Relay Sequencer", "Battery Thermal Management", 
        "Dead-Time Compensation", "V/f Motor Control", "Direct Torque Control (DTC)", 
        "Flyback Controller Firmware", "Droop Control for Microgrids", "Boost PFC (Power Factor Correction)", 
        "CANopen Motor Profile", "High-Voltage Interlock (HVIL)", "Inverter Over-temperature Derating", 
        "Wind Turbine Pitch Controller"
    ]
}

def get_skills_for_component(component, category):
    skills = ["eee-embedded"]
    comp_lower = component.lower()
    if "bms" in comp_lower or "battery" in comp_lower or "soc" in comp_lower or "soh" in comp_lower or "cell" in comp_lower:
        skills.extend(["bms", "li-ion", "adc-polling", "safety-critical"])
    elif "motor" in comp_lower or "foc" in comp_lower or "svpwm" in comp_lower or "dtc" in comp_lower:
        skills.extend(["motor-control", "pwm", "clarke-park-transforms", "pid"])
    elif "mppt" in comp_lower or "solar" in comp_lower or "inverter" in comp_lower or "pfc" in comp_lower or "dc-dc" in comp_lower:
        skills.extend(["power-electronics", "control-loop", "perturb-and-observe"])
    elif "grid" in comp_lower or "relay" in comp_lower or "islanding" in comp_lower:
        skills.extend(["smart-grid", "dsp", "protection", "pll"])
    else:
        words = component.lower().replace('/', ' ').replace('-', ' ').replace('(', '').replace(')', '').split()
        skills.extend(words[:3])
    return list(set(skills))

def get_company_tags(component, category):
    comp_lower = component.lower()
    if "battery" in comp_lower or "ev" in comp_lower or "motor" in comp_lower: 
        return random.sample(["Tesla", "Ather Energy", "Rivian", "Lucid Motors", "Bosch", "BorgWarner"], 3)
    if "grid" in comp_lower or "relay" in comp_lower or "meter" in comp_lower: 
        return random.sample(["Schneider Electric", "Siemens", "ABB", "General Electric", "Eaton"], 3)
    if "mppt" in comp_lower or "inverter" in comp_lower or "pfc" in comp_lower: 
        return random.sample(["Texas Instruments", "Infineon", "Enphase", "SolarEdge", "STMicroelectronics"], 3)
    return random.sample(COMPANIES, 3)

# Overrides for specific hardcore constraints
COMPONENT_OVERRIDES = {
    "Field Oriented Control (FOC)": {
        "I1_assert": "ASSERT_CLARKE_PARK_LATENCY<5us",
        "I2_assert": "ASSERT_TORQUE_RIPPLE<2PCT",
        "A1_assert": "ASSERT_FLUX_WEAKENING_RPM>5000",
        "INT_assert": "ASSERT_FOC_LOOP_RATE>=20kHz",
        "I1_constraint": "The Clarke/Park transform math must use fixed-point arithmetic (Q31 format). No floating point (FPU) allowed.",
        "I1_accept": "Simulation proves transform executes in under 5us on a Cortex-M4 without FPU.",
        "A1_constraint": "Implement Flux Weakening (Id injection) to exceed base speed.",
        "A1_accept": "Motor reaches 5000 RPM in simulation while maintaining control stability."
    },
    "Battery Management System (BMS)": {
        "I1_assert": "ASSERT_OVP_RESPONSE<50ms",
        "I2_assert": "ASSERT_SOC_ERROR<5PCT",
        "A1_assert": "ASSERT_ACTIVE_BALANCING_EFF>90PCT",
        "I1_constraint": "Hardware ADCs must be polled via DMA to avoid blocking CPU. Over-voltage threshold is 4.25V.",
        "I1_accept": "Discharge contactor opens within 50ms of any cell exceeding 4.25V.",
        "I2_title": "I2: Extended Kalman Filter for SoC",
        "I2_desc": "Implement an EKF in C to estimate State of Charge combining Coulomb counting and OCV.",
        "I2_constraint": "Matrix inversions must be optimized for embedded constraints.",
        "I2_accept": "SoC estimation remains within 5% error bounds across a full WLTP drive cycle simulation."
    },
    "Maximum Power Point Tracking (MPPT)": {
        "I1_assert": "ASSERT_TRACKING_EFF>98PCT",
        "I2_assert": "ASSERT_DYNAMIC_RESPONSE<1s",
        "A1_assert": "ASSERT_PARTIAL_SHADING_GM>90PCT",
        "I1_title": "I1: Perturb and Observe Algorithm",
        "I1_desc": "Write a P&O algorithm in C to maximize solar string output.",
        "I1_constraint": "Step size must dynamically adjust based on dP/dV.",
        "I1_accept": "Achieves >98% tracking efficiency in steady-state irradiation.",
        "A1_title": "A1: Global Peak Tracking",
        "A1_desc": "Modify the MPPT algorithm to find the Global Maximum Power Point (GMPP) during partial shading.",
        "A1_accept": "Algorithm successfully escapes local maxima and settles on the GMPP within 2 seconds."
    },
    "Space Vector PWM (SVPWM)": {
        "I1_assert": "ASSERT_SECTOR_CALC_LATENCY<2us",
        "I2_assert": "ASSERT_THD<5PCT",
        "A1_assert": "ASSERT_OVERMODULATION_INDEX=1.1",
        "I1_constraint": "Avoid trigonometry functions (sin/cos). Use look-up tables or algebraic sector determination.",
        "I2_accept": "Current THD must remain below 5% for a 50Hz fundamental."
    },
    "Digital Protective Relay": {
        "I1_assert": "ASSERT_TRIP_TIME<20ms",
        "I2_assert": "ASSERT_DFT_LATENCY<1ms",
        "A1_assert": "ASSERT_IEC61850_GOOSE_LATENCY<3ms",
        "I2_title": "I2: Half-Cycle DFT for Fault Detection",
        "I2_desc": "Implement a Discrete Fourier Transform in C on a half-cycle window to quickly estimate fault current magnitude.",
        "I2_constraint": "Must process 64 samples per cycle.",
        "I2_accept": "Magnitude estimated correctly within 1ms."
    }
}

def get_domain(stage_index):
    return DOMAINS[stage_index % len(DOMAINS)]

def generate_stage(stage_index, component, category, c_fmt):
    domain = get_domain(stage_index)
    
    diff_map = ["Beginner", "Intermediate", "Intermediate", "Advanced", "Interview"]
    prefix_map = ["B0", "I1", "I2", "A1", "INT"]
    
    difficulty = diff_map[stage_index]
    prefix = prefix_map[stage_index]
    
    # Base templates for EEE Embedded Firmware
    templates = [
        {"title": f"{prefix}: Bare-Metal {component} Initialization", "desc": f"Configure the base peripherals (ADC, PWM, Timers) for a {component} in a {domain} system.", "assert": f"ASSERT_{c_fmt}_INIT=OK", "cons": f"Follow best practices for {domain} automotive/grid standards.", "acc": "The simulator will verify register configurations."},
        {"title": f"{prefix}: Real-Time {component} Control Loop", "desc": f"Implement the core control logic for the {component}. This must run inside a high-priority hardware timer interrupt.", "assert": f"ASSERT_{c_fmt}_LOOP_LATENCY<50us", "cons": "Do not block the ISR. Avoid floating-point math if possible.", "acc": "Control loop executes deterministically."},
        {"title": f"{prefix}: Debugging {component} Transients", "desc": f"You are provided a broken implementation of {component} in a {domain} device. It fails during load transients.", "assert": f"ASSERT_{c_fmt}_TRANSIENT_RECOVERY<10ms", "cons": "Identify integration wind-up or ADC sampling aliasing.", "acc": "The system recovers from a 100% load step without faulting."},
        {"title": f"{prefix}: Highly Optimized {component}", "desc": f"Rearchitect the {component} to utilize DMA transfers and advanced hardware comparators for {domain}.", "assert": f"ASSERT_{c_fmt}_CPU_LOAD<10PCT", "cons": "CPU must be free to run communication stacks (CAN/Ethernet).", "acc": "Overall CPU load drops below 10%."},
        {"title": f"{prefix}: Fault-Tolerant {component} System", "desc": f"Design a high-reliability {component} architecture for a safety-critical {domain} application (ASIL-D).", "assert": f"ASSERT_{c_fmt}_SAFETY_TRIP_TIME<1ms", "cons": "Must handle sensor failures gracefully using observer models.", "acc": "Passes all ASIL-D fault injection tests."}
    ]
    
    t = templates[stage_index]
    
    if component in COMPONENT_OVERRIDES:
        ovr = COMPONENT_OVERRIDES[component]
        t["title"] = ovr.get(f"{prefix}_title", t["title"])
        t["desc"] = ovr.get(f"{prefix}_desc", t["desc"])
        t["assert"] = ovr.get(f"{prefix}_assert", t["assert"])
        t["cons"] = ovr.get(f"{prefix}_constraint", t["cons"])
        t["acc"] = ovr.get(f"{prefix}_accept", t["acc"])
        
    return {
        "id": str(uuid.uuid4()),
        "title": t["title"],
        "category": "eee-embedded",
        "component": component,
        "difficulty": difficulty,
        "skills": get_skills_for_component(component, category),
        "company_tags": get_company_tags(component, category),
        "description": f"**Context**: {t['desc']}\n\n**Constraints**: {t['cons']}\n\n**Acceptance Criteria**: {t['acc']}",
        "starter_code": f"// EEE Embedded Hardware Simulator Target\n// Component: {component}\n// Industry Domain: {domain}\n\n#include <stdint.h>\n#include <stdbool.h>\n\n// <ACADMIX_ASSERT_{t['assert']}>\n\nvoid {c_fmt.lower()}_init(void) {{\n    // TODO: Write your hardware configuration here\n}}\n\nvoid {c_fmt.lower()}_update(void) {{\n    // TODO: Write your real-time control loop here\n}}\n",
        "solution_code": None
    }

def generate_curriculum():
    problems = []
    
    for category in CATEGORIES:
        for component in COMPONENTS[category]:
            c_fmt = component.replace(" ", "_").replace("/", "_").replace("-", "_").replace("(", "").replace(")", "").upper()
            
            for stage_index in range(5):
                prob = generate_stage(stage_index, component, category, c_fmt)
                problems.append(prob)
                
    return problems

if __name__ == "__main__":
    print("Generating EEE Enterprise Curriculum (Embedded Category)...")
    dataset = generate_curriculum()
    
    out_dir = r"C:\AcadMix\frontend\src\data"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "eee_embedded_problems.json")
    
    with open(out_path, "w") as f:
        json.dump(dataset, f, indent=2)
        
    # Also generate a CSV for the user to review
    csv_path = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "eee_embedded_problems.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("ID,Category,Component,Difficulty,Title,Company_Tags,Skills\n")
        for p in dataset:
            companies = "|".join(p["company_tags"])
            skills = "|".join(p["skills"])
            title = p["title"].replace(",", "")
            f.write(f"{p['id']},{p['category']},{p['component']},{p['difficulty']},{title},{companies},{skills}\n")
            
    print(f"Successfully generated {len(dataset)} EEE embedded problems to {out_path}")
    print(f"CSV exported to {csv_path} for review.")
