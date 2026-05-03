import json
import uuid
import random
import os

CATEGORIES = ["embedded", "vlsi", "analog", "digital", "pcb"]
DOMAINS = ["Automotive", "Aerospace", "Consumer IoT", "Medical Devices", "Industrial Automation", "Robotics", "Telecommunications", "Wearables"]
COMPANIES = ["Tesla", "Bosch", "NXP", "Qualcomm", "NVIDIA", "Intel", "Apple", "AMD", "Texas Instruments", "Broadcom", "STMicroelectronics", "Microchip"]

COMPONENTS = {
    "embedded": ["GPIO Control", "Hardware Timer", "UART Interface", "I2C Sensor Reading", "SPI Display", "ADC Polling", "PWM Generation", "Interrupt Service Routine", "Watchdog Timer", "FreeRTOS Mutex", "FreeRTOS Semaphore", "Task Scheduling", "Power Sleep Modes", "MQTT Publisher", "WiFi Provisioning", "BLE Beacon", "CAN Bus Node", "DMA Transfer", "Flash Memory RW", "I2S Audio Interface", "RTC Module", "Touch Controller", "Stepper Motor Driver", "BLDC Motor Driver", "LCD Controller", "SDIO Interface", "USB OTG", "Hardware Crypto", "I2C EEPROM", "Buzzer Generator", "Rotary Encoder", "7-Segment Display"],
    "vlsi": ["Half Adder", "Full Adder", "Ripple Carry Adder", "Lookahead Carry Adder", "Multiplexer", "Priority Encoder", "Decoder", "ALU Design", "D Flip-Flop", "JK Flip-Flop", "Shift Register", "Ring Counter", "Johnson Counter", "Synchronous FIFO", "Asynchronous FIFO", "SRAM Bitcell Array", "Current Starved Inverter", "Transmission Gate Mux", "SPI Master FSM", "Clock Divider", "SRAM Sense Amp", "Dynamic Logic Gate", "Domino Logic Gate", "TSPC Latch", "Phase-Locked Loop (PLL)", "Delay-Locked Loop (DLL)", "Bandgap Reference", "Level Shifter", "Pad Ring Design", "Clock Tree Synthesis", "Scan Chain Element", "Power-On Reset (POR)"],
    "analog": ["RC Low-Pass Filter", "RC High-Pass Filter", "RLC Resonant Circuit", "Voltage Divider", "Wheatstone Bridge", "Half-Wave Rectifier", "Full-Wave Bridge Rectifier", "Diode Clipper", "Diode Clamper", "Zener Voltage Regulator", "BJT Common Emitter", "BJT Emitter Follower", "MOSFET Power Switch", "CMOS Inverter", "Differential Amplifier", "Inverting Op-Amp", "Non-Inverting Op-Amp", "Op-Amp Integrator", "Schmitt Trigger", "Active Bandpass Filter", "Colpitts Oscillator", "Hartley Oscillator", "Current Mirror", "Widlar Current Source", "Cascode Amplifier", "Darlington Pair", "Class A Power Amp", "Class B Push-Pull Amp", "Class AB Amplifier", "Class D Audio Amp", "Switch-Capacitor Filter", "Instrumentation Amp"],
    "digital": ["AND/OR/NOT Logic", "NAND Universal Logic", "XOR Parity Checker", "SOP Gate-Level Implementation", "4-bit Magnitude Comparator", "Binary to Gray Converter", "7-Segment Decoder", "BCD Adder", "D Latch Setup/Hold", "T Flip-Flop Logic", "Ripple Counter", "Synchronous Up/Down Counter", "LFSR", "ROM Implementation", "SRAM Cell Simulation", "Digital PWM Generator", "Switch Debouncing Logic", "ALU Flags Extraction", "State Machine Encoding", "Sequence Detector (1011)", "Barrel Shifter", "Carry Save Adder", "Wallace Tree Multiplier", "Booth Multiplier", "CORDIC Algorithm", "CRC Generator", "Hamming Code ECC", "Manchester Encoder", "NRZ to RZ Converter", "PWM to DAC", "Vending Machine FSM", "Traffic Light Controller"],
    "pcb": ["Decoupling Capacitors", "Pull-up/Pull-down Matrix", "LED Current Limiting", "Crystal Oscillator Layout", "LDO Thermal Dissipation", "Star Grounding Topology", "Split Ground Planes", "Via Stitching", "Thermal Relief Design", "Copper Pour Configuration", "Differential Pair Routing", "Trace Impedance Matching", "Length Matching (Tuning)", "USB 2.0 Routing", "Ethernet PHY Layout", "EMI Shielding Fences", "Creepage and Clearance", "Test Points Strategy", "BOM Optimization", "Silkscreen Layering", "Fiducial Placement", "Blind and Buried Vias", "Rigid-Flex Transition", "Solder Paste Stencil", "Conformal Coating", "VIPPO", "RF Match Network (Pi)", "Antenna Keep-out Zone", "DDR4 Routing Topology", "Backdrill Vias", "Tear-dropping Pads", "High-Voltage Isolation"]
}

def get_skills_for_component(component, category):
    skills = [category]
    if component == "Hardware Crypto": skills.extend(["aes", "sha", "hmac", "key-management", "side-channel"])
    elif component == "BLDC Motor Driver": skills.extend(["commutation", "back-emf", "foc", "hall-sensor", "six-step"])
    elif component == "CORDIC Algorithm": skills.extend(["fixed-point", "iterative-algorithm", "trigonometry", "rtl-optimization"])
    elif component == "Phase-Locked Loop (PLL)": skills.extend(["vco", "phase-detector", "charge-pump", "jitter", "loop-filter"])
    elif component == "Bandgap Reference": skills.extend(["ptat", "ctat", "tempco", "psrr", "startup-circuit"])
    elif component == "UART Interface": skills.extend(["baud-rate", "start-stop-bits", "framing", "parity"])
    elif "Adder" in component or "ALU" in component: skills.extend(["arithmetic", "carry-propagation", "datapath"])
    elif "Op-Amp" in component or "Amplifier" in component: skills.extend(["gain", "bandwidth", "feedback", "stability"])
    elif category == "pcb" and "Routing" in component: skills.extend(["signal-integrity", "impedance", "crosstalk"])
    elif category == "pcb" and "Thermal" in component: skills.extend(["heat-dissipation", "copper-pour", "vias"])
    else:
        words = component.lower().replace('/', ' ').replace('-', ' ').split()
        skills.extend(words)
        skills.append(f"{category}-core")
    return list(set(skills))

def get_company_tags(component, category):
    if category == "vlsi" or "SRAM" in component or "Adder" in component: return random.sample(["Intel", "AMD", "Apple", "NVIDIA", "TSMC", "Broadcom", "Qualcomm"], 3)
    if category == "analog" or "Amp" in component or "Oscillator" in component: return random.sample(["Texas Instruments", "Analog Devices", "Maxim Integrated", "Linear Tech", "NXP", "Infineon"], 3)
    if "CAN" in component or "Motor" in component or "Automotive" in component: return random.sample(["Bosch", "Denso", "Continental", "NXP", "STMicroelectronics", "Tesla", "Rivian"], 3)
    if "BLE" in component or "WiFi" in component or "RF" in component or "Antenna" in component: return random.sample(["Qualcomm", "Broadcom", "Skyworks", "Qorvo", "Nordic Semiconductor", "Apple"], 3)
    if "PCB" in category: return random.sample(["Apple", "SpaceX", "Tesla", "Cisco", "Arista", "Google", "Amazon Lab126"], 3)
    return random.sample(COMPANIES, 3)

def get_vlsi_delay(component):
    if "Half Adder" in component or "Logic Gate" in component or "Mux" in component or "Inverter" in component: return 50
    if "Ripple" in component or "Decoder" in component: return 400
    if "ALU" in component or "Multiplier" in component: return 800
    if "FIFO" in component or "SRAM" in component: return 600
    return 200

# Final Hardening: Overrides for constraints and acceptance criteria
COMPONENT_OVERRIDES = {
    "D Latch Setup/Hold": {
        "B0_assert": "ASSERT_D_LATCH_TRANSPARENT=1",
        "I1_assert": "ASSERT_SETUP_TIME>2ns",
        "I2_assert": "ASSERT_HOLD_TIME>0.5ns",
        "A1_assert": "ASSERT_METASTABILITY_WINDOW<100ps",
        "INT_assert": "ASSERT_SOFT_ERROR_RATE<1FIT",
        "I1_constraint": "Setup time must be measured from the 50% transition point of the data input to the 50% transition point of the clock edge.",
        "I1_accept": "Simulation passes with setup time exceeding 2.0ns without entering a metastable state."
    },
    "Phase-Locked Loop (PLL)": {
        "I1_assert": "ASSERT_LOCK_TIME<10us",
        "I2_assert": "ASSERT_JITTER_RMS<5ps",
        "A1_assert": "ASSERT_KVCO_LINEARITY_ERROR<2PCT",
        "INT_assert": "ASSERT_CAPTURE_RANGE>50MHz",
        "I1_constraint": "Loop filter capacitor must not exceed 100pF to save silicon area. Charge pump current is fixed at 50uA.",
        "I1_accept": "The control voltage (Vctrl) must settle to within 1% of its final value in under 10 microseconds for a 100MHz frequency step.",
        "I2_constraint": "Power supply noise is 50mV peak-to-peak at 1MHz.",
        "I2_accept": "RMS phase jitter must remain below 5ps under specified power supply noise conditions."
    },
    "FreeRTOS Mutex": {
        "B0_assert": "ASSERT_MUTEX_CREATED=1",
        "I1_assert": "ASSERT_DATA_CORRUPTION=0",
        "I2_assert": "ASSERT_PRIORITY_INHERITANCE=PASS",
        "A1_assert": "ASSERT_RECURSIVE_TAKE_PASS=1",
        "I2_title": "I2: Priority Inversion Debugging",
        "I2_desc": "A low priority task holds the mutex while a medium priority task preempts it, blocking a high priority task. Fix the priority inversion.",
        "I2_constraint": "Do not modify task priorities manually. You must configure the RTOS primitives correctly.",
        "I2_accept": "The high priority task must execute within 10 ticks of requesting the resource, demonstrating priority inheritance."
    },
    "UART Interface": {
        "A1_title": "A1: DMA-Backed UART Rx with Idle Line Detection",
        "A1_desc": "Configure the UART peripheral to use circular DMA for reception, utilizing the IDLE line interrupt to process variable-length packets.",
        "A1_assert": "ASSERT_DMA_IDLE_RX=PASS",
        "A1_constraint": "CPU overhead must be exactly 0% during byte reception. CPU should only wake up on the IDLE line interrupt.",
        "A1_accept": "Receive 12, 64, and 128 byte packets consecutively without dropping bytes or triggering framing errors."
    },
    "Hardware Crypto": {
        "B0_desc": "Initialize AES peripheral and configure key registers.",
        "I1_title": "I1: Memory-Mapped Crypto Interface",
        "I1_desc": "Write blocks to the crypto accelerator using polling.",
        "I1_assert": "ASSERT_AES_ENCRYPT_PASS=1",
        "A1_title": "A1: DMA-Backed Crypto Stream",
        "A1_desc": "Stream 1MB of ciphertext via DMA.",
        "A1_assert": "ASSERT_DMA_THROUGHPUT>50MBps",
        "A1_constraint": "Use linked-list DMA (scatter-gather) to feed the crypto engine from non-contiguous memory blocks.",
        "A1_accept": "Throughput must exceed 50MB/s with the CPU entirely in sleep mode (WFI)."
    },
    "BLDC Motor Driver": {
        "I2_title": "I2: Back-EMF Zero-Crossing Detection",
        "I2_desc": "Implement sensorless commutation by detecting the back-EMF zero-crossing point using the MCU's internal ADCs.",
        "I2_assert": "ASSERT_ZCD_ACCURACY<2DEG",
        "I2_constraint": "ADC conversions must be triggered by the PWM timer to avoid switching noise (center-aligned PWM).",
        "I2_accept": "Commutation must occur exactly 30 electrical degrees after the detected zero-crossing event."
    },
    "Bandgap Reference": {
        "I1_assert": "ASSERT_VREF=1.2V_1PCT",
        "I2_assert": "ASSERT_TEMPCO<50ppm",
        "I2_constraint": "Temperature range is -40C to 125C. Supply voltage varies from 2.7V to 3.6V.",
        "I2_accept": "The Vref output must remain within +/- 50 ppm/C across the entire temperature sweep."
    },
    "CORDIC Algorithm": {
        "A1_title": "A1: Pipelined CORDIC for Sine/Cosine",
        "A1_desc": "Implement a 16-stage pipelined CORDIC architecture in Verilog to compute sine and cosine simultaneously.",
        "A1_assert": "ASSERT_THROUGHPUT_1CLK=PASS",
        "A1_constraint": "No hardware multipliers are allowed. Use only shift-and-add operations. Output must be 16-bit fixed point.",
        "A1_accept": "Throughput must be 1 result per clock cycle after the initial 16-cycle latency. Max error < 0.1%."
    },
    "DDR4 Routing Topology": {
        "A1_title": "A1: Fly-By Topology with Length Matching",
        "A1_desc": "Route the address, command, and control signals for 4 DDR4 chips using a fly-by topology.",
        "A1_assert": "ASSERT_SKEW_ADDR_CLK<10ps",
        "A1_constraint": "Address lines must be length-matched to the clock signal within +/- 10ps. VTT termination must be placed at the end of the line.",
        "A1_accept": "Signal integrity simulation must show eye diagram openings greater than 600mV and 0.5UI."
    },
    "Colpitts Oscillator": {
        "I1_assert": "ASSERT_OSC_FREQ=10MHz_5PCT",
        "I2_assert": "ASSERT_STARTUP_MARGIN>2",
        "A1_assert": "ASSERT_THD<1PCT",
        "A1_constraint": "The biasing network must ensure the transistor remains in the active region to prevent clipping.",
        "A1_accept": "Total Harmonic Distortion (THD) must measure below 1% at the fundamental frequency."
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
    
    if category == "embedded":
        templates = [
            {"title": f"{prefix}: Bare-Metal {component} Bring-up", "desc": f"Configure the base registers for a {component} to achieve basic functionality in an {domain} system.", "assert": f"ASSERT_{c_fmt}_INIT=OK", "cons": f"Follow best practices for {domain} industry standards.", "acc": "The simulator will verify the performance metrics."},
            {"title": f"{prefix}: Interrupt-Driven {component} Architecture", "desc": f"Migrate the {component} from polling to an interrupt-driven state machine for {domain}.", "assert": f"ASSERT_{c_fmt}_IRQ_HANDLED=100", "cons": "Do not block the main CPU loop.", "acc": "Interrupt fires and clears properly."},
            {"title": f"{prefix}: Debugging {component} Edge Cases", "desc": f"You are provided a broken implementation of {component} in a {domain} device. Intermittent failures occur.", "assert": f"ASSERT_{c_fmt}_RECOVERY_TIME<1ms", "cons": "Identify race conditions or unhandled interrupts.", "acc": "The system recovers from fault injections."},
            {"title": f"{prefix}: Highly Optimized {component}", "desc": f"Rearchitect the {component} to utilize DMA transfers and Deep Sleep in {domain}.", "assert": f"ASSERT_{c_fmt}_CPU_LOAD<5PCT", "cons": "CPU must remain in deep sleep during data transfer.", "acc": "Overall CPU load drops below 5%."},
            {"title": f"{prefix}: Fault-Tolerant {component} System", "desc": f"Design a high-reliability {component} architecture for a safety-critical {domain} application.", "assert": f"ASSERT_{c_fmt}_FAULT_RECOVERY=SAFE", "cons": "Must handle hardware resets without state loss.", "acc": "Passes all SIL-2 safety unit tests."}
        ]
    elif category == "analog":
        templates = [
            {"title": f"{prefix}: DC Bias & Ideal {component}", "desc": f"Design the DC biasing network for an ideal {component} in a {domain} sensor node.", "assert": f"ASSERT_{c_fmt}_DC_BIAS=TARGET", "cons": "Use standard 1% resistor values.", "acc": "DC operating point within 5% of target."},
            {"title": f"{prefix}: Frequency Response Analysis", "desc": f"Determine the cutoff frequency and bandwidth of the {component} for {domain}.", "assert": f"ASSERT_{c_fmt}_BW>10kHz", "cons": "Load capacitance is 10pF.", "acc": "Bode plot shows -3dB point correctly."},
            {"title": f"{prefix}: Debugging {component} Instability", "desc": f"A prototype {component} is oscillating. Identify and fix the phase margin issue.", "assert": f"ASSERT_{c_fmt}_PHASE_MARGIN>45", "cons": "Cannot change the core amplifier topology.", "acc": "Phase margin is greater than 45 degrees."},
            {"title": f"{prefix}: Low-Noise {component} Design", "desc": f"Optimize the {component} for a high-precision {domain} measurement system.", "assert": f"ASSERT_{c_fmt}_NOISE<10nV", "cons": "Minimize thermal noise in input resistors.", "acc": "Input referred noise density under target."},
            {"title": f"{prefix}: Mixed-Signal Interface", "desc": f"Design the buffering for the {component} driving a high-speed ADC.", "assert": f"ASSERT_{c_fmt}_SETTLING<100ns", "cons": "Must drive 5pF sampling capacitor.", "acc": "Settles to 0.1% in under 100ns."}
        ]
    elif category == "digital":
        templates = [
            {"title": f"{prefix}: RTL Implementation of {component}", "desc": f"Write the Verilog/SystemVerilog RTL for the {component} used in {domain}.", "assert": f"ASSERT_{c_fmt}_RTL_LATCH_FREE=1", "cons": "Code must be fully synthesizable.", "acc": "Passes structural and functional RTL checks."},
            {"title": f"{prefix}: Parameterized {component}", "desc": f"Convert the {component} to a parameterized module (N-bits).", "assert": f"ASSERT_{c_fmt}_PARAM_WIDTH=N", "cons": "Use Verilog parameters or SystemVerilog interfaces.", "acc": "Simulates correctly for N=8, N=16, N=32."},
            {"title": f"{prefix}: Debugging Setup/Hold", "desc": f"The {component} fails timing simulation. Fix the critical path.", "assert": f"ASSERT_{c_fmt}_WNS>=0", "cons": "Do not alter the clock frequency.", "acc": "Worst Negative Slack (WNS) is >= 0."},
            {"title": f"{prefix}: Clock Domain Crossing (CDC)", "desc": f"The {component} must interface between two clock domains in {domain}.", "assert": f"ASSERT_{c_fmt}_CDC_VIOLATIONS=0", "cons": "Use multi-flop synchronizers or async FIFOs.", "acc": "Passes 0-in CDC verification checks."},
            {"title": f"{prefix}: Power-Optimized Architecture", "desc": f"Design the {component} for an ultra-low-power {domain} ASIC.", "assert": f"ASSERT_{c_fmt}_PWR_DROP>40PCT", "cons": "Implement clock gating where appropriate.", "acc": "Dynamic power simulation shows 40% reduction."}
        ]
    elif category == "vlsi":
        delay = get_vlsi_delay(component)
        templates = [
            {"title": f"{prefix}: Schematic & Layout of {component}", "desc": f"Draw the transistor-level schematic and layout for a {component}.", "assert": f"ASSERT_{c_fmt}_LVS=MATCH", "cons": "Use minimum sized transistors first.", "acc": "DRC and LVS clean."},
            {"title": f"{prefix}: Logical Effort & Sizing", "desc": f"Size the transistors in the {component} for minimum delay.", "assert": f"ASSERT_{c_fmt}_DELAY<{delay}ps", "cons": "Calculate logical effort before simulating.", "acc": f"Propagation delay is less than {delay}ps."},
            {"title": f"{prefix}: Debugging Layout Parasitics", "desc": f"Post-layout simulation of the {component} reveals significant RC delay.", "assert": f"ASSERT_{c_fmt}_PEX_DELAY<{delay+50}ps", "cons": "Optimize metal routing layers.", "acc": "Parasitic extraction simulation meets timing."},
            {"title": f"{prefix}: Leakage Power Mitigation", "desc": f"The {component} is burning too much static power.", "assert": f"ASSERT_{c_fmt}_LEAKAGE<1nA", "cons": "Use high-Vt cells where timing allows.", "acc": "Static leakage current is reduced."},
            {"title": f"{prefix}: Process, Voltage, Temperature Corners", "desc": f"Validate the {component} across all PVT corners for {domain}.", "assert": f"ASSERT_{c_fmt}_PVT_FAILURES=0", "cons": "Simulate FF, SS, FS, SF corners.", "acc": "Passes all corner simulations without failure."}
        ]
    else: # PCB
        templates = [
            {"title": f"{prefix}: Footprints & Placement for {component}", "desc": f"Select components and define the board placement for the {component}.", "assert": f"ASSERT_{c_fmt}_DRC_SPACING=PASS", "cons": "Respect component keep-out zones.", "acc": "Passes physical DRC checks."},
            {"title": f"{prefix}: Specific constraints for {component}", "desc": f"Address the high-speed/power routing specifically for {component} in {domain}.", "assert": f"ASSERT_{c_fmt}_IMPEDANCE_MATCH=PASS", "cons": "Match trace impedance to target.", "acc": "TDR simulation shows matching impedance."},
            {"title": f"{prefix}: Debugging {component} Signal Integrity", "desc": f"The {component} suffers from signal integrity issues due to a poor return path.", "assert": f"ASSERT_{c_fmt}_GROUND_BOUNCE<50mV", "cons": "Do not route over split planes.", "acc": "Ground bounce is eliminated."},
            {"title": f"{prefix}: Thermal Management for {component}", "desc": f"Design the thermal relief for the {component}.", "assert": f"ASSERT_{c_fmt}_TJ<85C", "cons": "Use thermal vias under the exposed pad.", "acc": "Thermal simulation shows Tj < 85C."},
            {"title": f"{prefix}: EMI/EMC Mitigation in {component}", "desc": f"The {component} is failing radiated emissions.", "assert": f"ASSERT_{c_fmt}_EMI_MARGIN>10dB", "cons": "Implement proper grounding and shielding.", "acc": "Passes CISPR emissions simulation."}
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
        "difficulty": difficulty,
        "title": t["title"],
        "description": t["desc"],
        "constraints": t["cons"],
        "acceptance_criteria": t["acc"],
        "validation_hooks": f"// <ACADMIX_{t['assert']}>"
    }

def generate_problems():
    problems = []
    for category in CATEGORIES:
        for component in COMPONENTS[category]:
            c_fmt = component.upper().replace(' ', '_').replace('/', '_').replace('-', '_')
            for i in range(5):
                stage = generate_stage(i, component, category, c_fmt)
                tags = get_company_tags(component, category)
                skills = get_skills_for_component(component, category)
                
                full_desc = f"**Context:** {get_domain(i)}\n\n**Spec:** {stage['description']}\n\n**Constraints:** {stage['constraints']}\n\n**Acceptance Criteria:** {stage['acceptance_criteria']}"
                
                problem = {
                    "id": f"ece_{category}_{str(uuid.uuid4())[:8]}",
                    "category": category,
                    "component": component,
                    "difficulty": stage["difficulty"],
                    "title": stage["title"],
                    "skills": skills,
                    "company_tags": tags,
                    "description": full_desc,
                    "starter_code": f"// Starter code for {component} - {stage['title']}\n{stage['validation_hooks']}\n\n",
                    "simulator_preset": "default"
                }
                problems.append(problem)
    return problems

if __name__ == "__main__":
    output_path = r"C:\AcadMix\frontend\src\data\ece_problems.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    problems = generate_problems()
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(problems, f, indent=2)
    print(f"Successfully generated {len(problems)} enterprise-grade ECE problems to {output_path}")
