import json
import uuid
import random
import os

CATEGORIES = ["embedded", "vlsi", "analog", "digital", "pcb"]
DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Interview"]
DOMAINS = ["Automotive", "Aerospace", "Consumer IoT", "Medical Devices", "Industrial Automation", "Robotics", "Telecommunications", "Wearables"]

# 20 Deep technical components per category
COMPONENTS = {
    "embedded": [
        "GPIO Control", "Hardware Timer", "UART Interface", "I2C Sensor Reading", "SPI Display", 
        "ADC Polling", "PWM Generation", "Interrupt Service Routine", "Watchdog Timer", 
        "FreeRTOS Mutex", "FreeRTOS Semaphore", "Task Scheduling", "Power Sleep Modes", 
        "MQTT Publisher", "WiFi Provisioning", "BLE Beacon", "CAN Bus Node", "DMA Transfer", 
        "Flash Memory R/W", "I2S Audio Interface"
    ],
    "vlsi": [
        "Half Adder", "Full Adder", "Ripple Carry Adder", "Lookahead Carry Adder", "Multiplexer",
        "Priority Encoder", "Decoder", "ALU Design", "D Flip-Flop", "JK Flip-Flop",
        "Shift Register", "Ring Counter", "Johnson Counter", "Synchronous FIFO", "Asynchronous FIFO",
        "Vending Machine FSM", "Traffic Light Controller", "UART Transmitter", "SPI Master FSM", "Clock Divider"
    ],
    "analog": [
        "RC Low-Pass Filter", "RC High-Pass Filter", "RLC Resonant Circuit", "Voltage Divider", "Wheatstone Bridge",
        "Half-Wave Rectifier", "Full-Wave Bridge Rectifier", "Diode Clipper", "Diode Clamper", "Zener Voltage Regulator",
        "BJT Common Emitter", "BJT Emitter Follower", "MOSFET Power Switch", "CMOS Inverter", "Differential Amplifier",
        "Inverting Op-Amp", "Non-Inverting Op-Amp", "Op-Amp Integrator", "Schmitt Trigger", "Active Bandpass Filter"
    ],
    "digital": [
        "AND/OR/NOT Logic", "NAND Universal Logic", "XOR Parity Checker", "K-Map Minimization", "4-bit Magnitude Comparator",
        "Binary to Gray Converter", "7-Segment Decoder", "BCD Adder", "D Latch Setup/Hold", "T Flip-Flop Logic",
        "Ripple Counter", "Synchronous Up/Down Counter", "LFSR", "ROM Implementation", "SRAM Cell Simulation",
        "Digital PWM Generator", "Switch Debouncing Logic", "ALU Flags Extraction", "State Machine Encoding", "Sequence Detector (1011)"
    ],
    "pcb": [
        "Decoupling Capacitors", "Pull-up/Pull-down Matrix", "LED Current Limiting", "Crystal Oscillator Layout", "LDO Thermal Dissipation",
        "Star Grounding Topology", "Split Ground Planes", "Via Stitching", "Thermal Relief Design", "Copper Pour Configuration",
        "Differential Pair Routing", "Trace Impedance Matching", "Length Matching (Tuning)", "USB 2.0 Routing", "Ethernet PHY Layout",
        "EMI Shielding Fences", "Creepage and Clearance", "Test Points Strategy", "BOM Optimization", "Silkscreen Layering"
    ]
}

# Thematic real-world scenarios to cross with components
SCENARIOS = [
    "Design a {component} for a strict low-power {domain} application.",
    "Implement a {component} that handles high-frequency noise in an {domain} environment.",
    "Build a robust {component} required for the core safety loop of an {domain} system.",
    "Draft the architecture for a {component} used in a next-generation {domain} product.",
    "Optimize a legacy {component} to meet the strict timing constraints of an {domain} standard.",
    "Create a test-driven {component} implementation for a FAANG-level {domain} interview.",
    "Design a fault-tolerant {component} that recovers from state corruption in {domain} devices.",
    "Develop a cost-optimized {component} suitable for mass production in {domain}.",
    "Implement a high-speed {component} ensuring strict signal integrity for {domain} specs.",
    "Design a modular {component} that can be reused across multiple {domain} product lines."
]

def generate_problems():
    problems = []
    
    # Generate 160 problems per category = 800 total problems
    for category in CATEGORIES:
        cat_components = COMPONENTS[category]
        for component in cat_components:
            # 8 variations per component
            for i in range(8):
                domain = random.choice(DOMAINS)
                difficulty = random.choices(DIFFICULTIES, weights=[20, 40, 30, 10])[0]
                scenario_template = random.choice(SCENARIOS)
                
                title = f"{domain}: {component}"
                description = scenario_template.format(component=component, domain=domain)
                
                # Adding technical flavor based on difficulty
                if difficulty == "Beginner":
                    description += "\n\n**Focus:** Understand the basic functionality and get a minimal working prototype."
                elif difficulty == "Intermediate":
                    description += "\n\n**Focus:** Ensure your design is efficient and handles basic edge cases (e.g., floating inputs, noise)."
                elif difficulty == "Advanced":
                    description += "\n\n**Focus:** Your design must be highly optimized (power/area/timing) and strictly adhere to industry standards."
                else:
                    description += "\n\n**Focus:** This is a classic Tier-1 semiconductor interview question. Pay extreme attention to worst-case scenarios and be prepared to justify your architectural trade-offs."
                
                # Assign relevant companies
                companies = ["Tesla", "Bosch", "NXP", "Qualcomm", "NVIDIA", "Intel", "Apple", "AMD", "Texas Instruments", "Broadcom", "STMicroelectronics", "Microchip"]
                num_tags = random.randint(1, 3)
                tags = random.sample(companies, num_tags)
                
                problem = {
                    "id": f"ece_{category}_{str(uuid.uuid4())[:8]}",
                    "category": category,
                    "difficulty": difficulty,
                    "title": title,
                    "company_tags": tags,
                    "description": description,
                    "starter_code": f"// Starter code for {component}\n// Simulator auto-validation hooks enabled.\n\n",
                    "simulator_preset": "default"
                }
                problems.append(problem)
                
    return problems

if __name__ == "__main__":
    output_path = r"C:\AcadMix\frontend\src\data\ece_problems.json"
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print("Generating curriculum data...")
    problems = generate_problems()
    
    with open(output_path, "w") as f:
        json.dump(problems, f, indent=2)
        
    print(f"Successfully generated {len(problems)} enterprise-grade ECE problems to {output_path}")
