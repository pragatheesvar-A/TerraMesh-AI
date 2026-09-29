import os
import glob

replacements = {
    "DGMS Reg. 112": "Project Standard 112",
    "DGMS Regulation 112": "Project Standard 112",
    "DGMS Reg 112": "Project Standard 112",
    "DGMS Reg 124": "Project Standard 124",
    "DGMS Regulation 124": "Project Standard 124",
    "DGMS CERTIFIED": "SYSTEM VERIFIED",
    "DGMS Compliant": "Threshold Compliant",
    "DGMS Compliance": "Threshold Compliance",
    "DGMS Statutory": "Engineering Safety",
    "DGMS statutory": "engineering safety",
    "DGMS Log Reg. 112": "Safety Log",
    "DGMS Circular 04": "Safety Circular 04",
    "DGMS_REG_112": "PROJECT_REG_112",
    "DGMS_THRESHOLDS": "PROJECT_DEFINED_THRESHOLDS",
    "statutory DGMS": "engineering",
    "statutory DGMS limits": "engineering safety limits",
    "DGMS cutoff": "Engineering Cutoff",
    "DGMS Cutoff": "Engineering Cutoff",
    "DGMS Limits": "Engineering Limits",
    "DGMS Limit": "Engineering Limit",
    "DGMS Limits:": "Engineering Limits:",
    "statutory limit": "engineering limit",
    "statutory limits": "engineering limits",
    "Statutory limits": "Engineering limits",
    "DGMS Code:": "Safety Code:",
    "DGMS Violation": "Threshold Violation",
    "dgmsViolation": "thresholdViolation",
    "DGMS Statutory Lease Boundary": "Project Lease Boundary",
    "DGMS Regulatory Inspector": "Safety Auditor",
    "Chief Mine Safety Controller (Level 5 DGMS)": "Chief Mine Safety Controller (Level 5)",
    "DGMS Regulatory": "Safety Regulatory",
    "Level 5 DGMS": "Level 5",
    "DGMS Code": "Safety Code",
    "DGMS Diagnosis": "System Diagnosis",
    
    # Specific False claims replacements
    "LIVE SATELLITE": "SIMULATED SATELLITE DATA",
    "LIVE SATELLITE DATA": "SIMULATED SATELLITE DATA",
    "LIVE SATELLITE STREAM": "SIMULATED SATELLITE STREAM",
    "DEPLOYED TINYML MODEL": "EDGE INFERENCE SIMULATOR",
    "DEPLOYED TINYML": "EDGE INFERENCE SIMULATOR",
    "SIGNED DOSSIER": "GENERATED SAFETY REPORT",
    "Statutory Dossier": "Safety Report",
    "Statutory Incident Dossier": "Safety Incident Report",
    "Compliance Dossier": "Safety Report",
    "Compliance Dossiers": "Safety Reports",
    "Audit Dossier": "Audit Report",
    "Incident Dossier": "Incident Report",
    "Dossier ID": "Report ID",
    "Export Dossier": "Export Report",
    "Exported Dossier": "Exported Report",
    "Dossier Exported": "Report Exported",
    "Geotechnical Safety Incident Dossier": "Geotechnical Safety Incident Report",
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        for old, new in replacements.items():
            if old in content:
                content = content.replace(old, new)
                modified = True
                
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Skipping {filepath}: {e}")

if __name__ == "__main__":
    search_dirs = [
        "d:\\COAL MINE\\apps\\mineguard-core\\frontend\\src",
        "d:\\COAL MINE\\apps\\mineguard-core\\backend"
    ]
    
    for d in search_dirs:
        for root, dirs, files in os.walk(d):
            for file in files:
                if file.endswith(".js") or file.endswith(".jsx") or file.endswith(".py") or file.endswith(".json"):
                    process_file(os.path.join(root, file))
    print("Done replacing claims.")
