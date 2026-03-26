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
        
        # Title and Header
        elements.append(Paragraph(f"Financial Insights Executive Report", styles['Title']))
        elements.append(Paragraph(f"User: {current_user.username} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 24))
        
        # 1. Executive Summary / Burn Rate
        elements.append(Paragraph("Monthly Budget Overview", styles['Heading2']))
        burn = summary["burn_rate"]
        summary_text = (
            f"For the current month, your total budget is <b>Rs. {burn['total_budget']:.2f}</b>. "
            f"You have spent <b>Rs. {burn['total_spent']:.2f}</b> so far, which is <b>{burn['usage_percent']}%</b> of your monthly limit."
        )
        elements.append(Paragraph(summary_text, styles['Normal']))
        elements.append(Spacer(1, 20))

        # 2. Spending by Category
        elements.append(Paragraph("Spending by Category (Current Month)", styles['Heading2']))
        if not summary["category_breakdown"]:
            elements.append(Paragraph("No category data available for this period.", styles['Normal']))
        else:
            cat_data = [["Category", "Total Spent"]]
            for item in summary["category_breakdown"]:
                cat_data.append([item["Category"], f"Rs. {item['Total_Spent']:.2f}"])
            
            t1 = Table(cat_data, colWidths=[200, 150])
            t1.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white])
            ]))
            elements.append(t1)
        elements.append(Spacer(1, 20))

        # 3. Top Merchants
        elements.append(Paragraph("Top Merchants (Current Month)", styles['Heading2']))
        if not summary["top_merchants"]:
            elements.append(Paragraph("No merchant data available.", styles['Normal']))
        else:
            merch_data = [["Merchant", "Total Spent"]]
            for item in summary["top_merchants"]:
                merch_data.append([item["Merchant"], f"Rs. {item['Total_Spent']:.2f}"])
            
            t3 = Table(merch_data, colWidths=[200, 150])
            t3.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#10b981")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white])
            ]))
            elements.append(t3)
        elements.append(Spacer(1, 20))
        
        # 4. Monthly Trends
        elements.append(Paragraph("Monthly Trends (Last 12 Months)", styles['Heading2']))
        if not summary["monthly_trends"]:
            elements.append(Paragraph("No historical data available.", styles['Normal']))
        else:
            trend_data = [["Month", "Income", "Expense", "Savings"]]
            for item in summary["monthly_trends"]:
                trend_data.append([
                    item["Month"], 
                    f"Rs. {item['Income']:.2f}", 
                    f"Rs. {item['Expense']:.2f}", 
                    f"Rs. {item['Net_Savings']:.2f}"
                ])
            
            t2 = Table(trend_data, colWidths=[100, 100, 100, 100])
            t2.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#6366f1")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white])
            ]))
            elements.append(t2)
        elements.append(Spacer(1, 24))

        # 5. Financial Recommendations (New)
        elements.append(Paragraph("Personalized Recommendations", styles['Heading2']))
        recommendations = []
        
        # Burn Rate Logic
        if burn["usage_percent"] > 80:
            recommendations.append("<b>Budget Alert:</b> Your spending has exceeded 80% of your budget. We recommend pausing non-essential purchases for the remainder of the month.")
        
        # Savings Logic (from Monthly Trends)
        if summary["monthly_trends"]:
            latest = summary["monthly_trends"][0]
            if latest["Net_Savings"] < 0:
                recommendations.append("<b>Savings Warning:</b> You had a deficit this month. Review your 'Top Merchants' to identify potential areas for immediate cost-cutting.")
            elif latest["Income"] > 0 and (latest["Net_Savings"] / latest["Income"]) > 0.2:
                recommendations.append(f"<b>Excellent Savings:</b> You saved over 20% of your income! Consider moving Rs. {latest['Net_Savings']*0.5:.2f} to your investment portfolio.")

        # Category Logic
        if summary["category_breakdown"]:
            top_cat = summary["category_breakdown"][0]
            if top_cat["Total_Spent"] > 5000:
                 recommendations.append(f"<b>High Spending in {top_cat['Category']}:</b> This category accounts for your largest expense. Look for loyalty programs or discounts to optimize this spending.")

        if not recommendations:
            recommendations.append("Your finances look stable! You're doing a great job managing your money—keep going and maintain these healthy habits!")

        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", styles['Normal']))
            elements.append(Spacer(1, 6))
        
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
