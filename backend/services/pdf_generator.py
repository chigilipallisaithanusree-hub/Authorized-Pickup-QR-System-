from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io

class PDFGenerator:
    @staticmethod
    def generate_pickup_report(logs, start_date_str=None, end_date_str=None):
        """
        Generates a clean PDF document containing pickup logs using ReportLab.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Define clean, custom typography elements
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#2D5288'),
            spaceAfter=12
        )
        
        meta_style = ParagraphStyle(
            'ReportMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=24
        )
        
        header_cell_style = ParagraphStyle(
            'HeaderCell',
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=11,
            textColor=colors.white
        )
        
        cell_style = ParagraphStyle(
            'BodyCell',
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0F172A')
        )
        
        story = []
        
        # Title
        story.append(Paragraph("FirstCry Intelliots Portal - Dismissal Log Report", title_style))
        
        # Meta constraints info
        date_range = f"Date Range: {start_date_str or 'All Time'} to {end_date_str or 'All Time'}"
        story.append(Paragraph(f"Generated on: {logs[0]['createdAt'][:10] if logs else 'N/A'} | {date_range} | Records: {len(logs)}", meta_style))
        story.append(Spacer(1, 10))
        
        # Table columns setup
        # Widths total 540 (letter width is 612 - 72 margins)
        col_widths = [110, 110, 110, 70, 140]
        
        table_data = [[
            Paragraph("Student Name", header_cell_style),
            Paragraph("Guardian Name", header_cell_style),
            Paragraph("Verified By (Teacher)", header_cell_style),
            Paragraph("Status", header_cell_style),
            Paragraph("Timestamp", header_cell_style)
        ]]
        
        for log in logs:
            status_text = log['status']
            # Highlight rejected scans in bold red
            if status_text == 'REJECTED':
                status_html = f"<font color='#EF4444'><b>REJECTED</b></font>"
            else:
                status_html = f"<font color='#22C55E'>APPROVED</font>"
                
            table_data.append([
                Paragraph(log['studentName'], cell_style),
                Paragraph(f"{log['guardianName']} ({log.get('guardianRelationship', 'Guardian')})", cell_style),
                Paragraph(log['teacherName'], cell_style),
                Paragraph(status_html, cell_style),
                Paragraph(log['createdAt'].replace('T', ' ').split('.')[0], cell_style)
            ])
            
        logs_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        # Table Styling matching visual guidelines
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2D5288')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FFFCEF')]),
        ])
        logs_table.setStyle(style)
        
        story.append(logs_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
