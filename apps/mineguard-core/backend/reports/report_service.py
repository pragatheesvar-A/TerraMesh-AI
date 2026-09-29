import logging
from typing import Dict, Any
from .pdf_generator import PDFGenerator

logger = logging.getLogger("terramesh.reports.service")

class ReportService:
    def __init__(self):
        pass
        
    def generate_report(self, report_type: str, data: Dict[str, Any]) -> bytes:
        """
        Generates a PDF report of the specified type.
        Available types: daily_safety, incident_report, panel_risk, sensor_health, evacuation_report
        """
        title_map = {
            "daily_safety": "Daily Safety & Operations Report",
            "incident_report": "Critical Incident Report",
            "panel_risk": "Panel Risk Assessment",
            "sensor_health": "Sensor Network Health Report",
            "evacuation_report": "Evacuation & Emergency Report",
            # Historical key kept for frontend compatibility; "Dossier" wording
            # removed — this document carries NO signature or certification.
            "dgms_112": "Project Standard 112 Strata Control Report"
        }
        # Report content is caller-supplied. Reports are NOT digitally signed:
        # no cryptographic signature exists, and none is claimed.
        
        title = title_map.get(report_type, "TerraMesh AI Report")
        
        try:
            pdf = PDFGenerator(report_title=title)
            pdf_bytes = pdf.build_report(data)
            logger.info(f"Generated {report_type} PDF successfully. Size: {len(pdf_bytes)} bytes")
            return pdf_bytes
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            raise e

report_service = ReportService()
