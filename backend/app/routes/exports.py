from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
import csv
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

import app.models as models
from app.database import get_db
from app.dependencies import get_current_user
from app.repositories.export_repository import ExportRepository

router = APIRouter(prefix="/export", tags=["Exports"])

def generate_csv_response(data, filename: str):
    if not data:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["No data found"])
        content = output.getvalue()
    else:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        content = output.getvalue()
    
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def generate_pdf_response(data, title: str, filename: str):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph(title, styles['Title']))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    if not data:
        elements.append(Paragraph("No records found.", styles['Normal']))
    else:
        # Prepare table data
        headers = list(data[0].keys())
        table_data = [headers]
        for row in data:
            table_data.append([str(row.get(h, "")) for h in headers])
        
        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
    
    doc.build(elements)
    content = buffer.getvalue()
    buffer.close()
    
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/transactions")
async def export_transactions(
    format: str = Query("csv", pattern="^(csv|pdf)$"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = ExportRepository(db)
    data = repo.get_transactions_for_export(current_user.id)
    
    filename = f"transactions_{datetime.now().strftime('%Y%m%d')}.{format}"
    
    if format == "csv":
        return generate_csv_response(data, filename)
    else:
        return generate_pdf_response(data, "Transaction Report", filename)

@router.get("/insights")
async def export_insights(
    format: str = Query("pdf", pattern="^(csv|pdf)$"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = ExportRepository(db)
    summary = repo.get_insights_summary_for_export(current_user.id)
    
    # Flattening for simple table export
    # For insights, PDF is preferred as it's more of a report
    if format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph(f"Financial Insights Report - {current_user.username}", styles['Title']))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Category Breakdown
        elements.append(Paragraph("Spending by Category", styles['Heading2']))
        cat_data = [["Category", "Total Spent"]]
        for item in summary["category_breakdown"]:
            cat_data.append([item["Category"], f"Rs. {item['Total_Spent']:.2f}"])
        
        t1 = Table(cat_data)
        t1.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1, colors.black), ('BACKGROUND', (0,0), (-1,0), colors.lightgrey)]))
        elements.append(t1)
        elements.append(Spacer(1, 20))
        
        # Monthly Trends
        elements.append(Paragraph("Monthly Trends (Last 12 Months)", styles['Heading2']))
        trend_data = [["Month", "Income", "Expense", "Savings"]]
        for item in summary["monthly_trends"]:
            trend_data.append([
                item["Month"], 
                f"Rs. {item['Income']:.2f}", 
                f"Rs. {item['Expense']:.2f}", 
                f"Rs. {item['Net_Savings']:.2f}"
            ])
        
        t2 = Table(trend_data)
        t2.setStyle(TableStyle([('GRID', (0,0), (-1,-1), 1, colors.black), ('BACKGROUND', (0,0), (-1,0), colors.lightgrey)]))
        elements.append(t2)
        
        doc.build(elements)
        content = buffer.getvalue()
        buffer.close()
        
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=insights_report.pdf"}
        )
    else:
        # For CSV, we'll just export the monthly trends as it's more tabular
        return generate_csv_response(summary["monthly_trends"], "insights_trends.csv")
