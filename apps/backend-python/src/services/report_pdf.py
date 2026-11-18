"""Renderizado del reporte de productividad en PDF (ReportLab), estilo glassy oscuro."""

import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime
from functools import partial
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from src.services.productivity import ProductivityMetrics

PAGE_WIDTH, PAGE_HEIGHT = A4
BACKGROUND = colors.HexColor("#0b1020")
CARD = colors.HexColor("#131a2e")
BORDER = colors.HexColor("#3b3f8f")
TEXT = colors.HexColor("#e2e8f0")
MUTED = colors.HexColor("#94a3b8")
ACCENT = colors.HexColor("#818cf8")
VIOLET = colors.HexColor("#8b5cf6")


@dataclass(frozen=True)
class AuditSeal:
    """Huella SHA-256 del contenido y firma HMAC-SHA256 del servidor sobre esa huella."""

    hash_hex: str
    signature_hex: str


def make_seal(payload: dict[str, Any], secret: str) -> AuditSeal:
    """Calcula el hash de auditoría y la firma del reporte (determinista para el mismo contenido)."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    signature = hmac.new(secret.encode("utf-8"), digest.encode("utf-8"), hashlib.sha256).hexdigest()

    return AuditSeal(hash_hex=digest, signature_hex=signature)


def safe_text(text: str) -> str:
    """Texto seguro para las fuentes base de ReportLab (Latin-1) y para Paragraph (escapado)."""
    return escape(text.encode("latin-1", "replace").decode("latin-1"))


def _paint_page(canvas: Canvas, doc: SimpleDocTemplate, issued_at: str, seal: AuditSeal) -> None:
    canvas.saveState()
    canvas.setFillColor(BACKGROUND)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    # Logo: marca índigo-violeta con las iniciales y el nombre.
    canvas.setFillColor(VIOLET)
    canvas.roundRect(18 * mm, PAGE_HEIGHT - 24 * mm, 10 * mm, 10 * mm, 2.5 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawCentredString(23 * mm, PAGE_HEIGHT - 20.5 * mm, "AI")
    canvas.setFillColor(TEXT)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(31 * mm, PAGE_HEIGHT - 20.5 * mm, "TaskMate AI")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(PAGE_WIDTH - 18 * mm, PAGE_HEIGHT - 20.5 * mm, f"Fecha de emisión: {issued_at}")

    # Pie: separador, hash de auditoría y firma digital.
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(18 * mm, 24 * mm, PAGE_WIDTH - 18 * mm, 24 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(18 * mm, 19 * mm, f"Hash de auditoría (SHA-256): {seal.hash_hex}")
    canvas.drawString(18 * mm, 15 * mm, f"Firma digital (HMAC-SHA256): {seal.signature_hex}")
    canvas.drawRightString(PAGE_WIDTH - 18 * mm, 10 * mm, f"Página {doc.page}")
    canvas.restoreState()


def _metric_card(label: str, value: str) -> list[Paragraph]:
    label_style = ParagraphStyle("label", fontName="Helvetica", fontSize=8, textColor=MUTED, leading=11)
    value_style = ParagraphStyle("value", fontName="Helvetica-Bold", fontSize=22, textColor=ACCENT, leading=26)

    return [Paragraph(safe_text(label.upper()), label_style), Paragraph(safe_text(value), value_style)]


def _metric_table(metrics: ProductivityMetrics) -> Table:
    cards = [
        _metric_card("Tareas totales", str(metrics.total)),
        _metric_card("Completadas", str(metrics.completed)),
        _metric_card("Rendimiento", f"{metrics.completion_rate}%"),
    ]
    table = Table([cards], colWidths=[57 * mm, 57 * mm, 57 * mm], rowHeights=[26 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CARD),
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.8, BACKGROUND),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    return table


def _summary_flowables(summary: str) -> list[Paragraph | Spacer]:
    body = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=15, textColor=TEXT, backColor=CARD, borderColor=BORDER, borderWidth=0.8, borderPadding=8, spaceAfter=8)
    heading = ParagraphStyle("heading", fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=TEXT, spaceAfter=8)
    paragraphs = [Paragraph(safe_text(line), body) for line in summary.splitlines() if line.strip()]

    return [Paragraph("Resumen ejecutivo", heading), *paragraphs]


def _story(metrics: ProductivityMetrics, summary: str) -> list[Any]:
    title = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=TEXT)
    subtitle = ParagraphStyle("subtitle", fontName="Helvetica", fontSize=10, leading=14, textColor=MUTED)
    priority_style = ParagraphStyle("priority", fontName="Helvetica", fontSize=10, leading=14, textColor=TEXT, spaceBefore=10, spaceAfter=14)
    high = metrics.high_priority
    priority_line = (
        f"Prioridad {high.label}: completaste el {high.rate}% ({high.completed} de {high.total}). "
        f"Vencidas sin completar: {metrics.overdue}. Esta semana creaste {metrics.week_created} y completaste {metrics.week_completed}."
    )

    return [
        Paragraph("Reporte de productividad", title),
        Paragraph("Diagnóstico generado con Groq a partir de tu historial de tareas.", subtitle),
        Spacer(1, 14),
        _metric_table(metrics),
        Paragraph(safe_text(priority_line), priority_style),
        *_summary_flowables(summary),
    ]


def render_report_pdf(metrics: ProductivityMetrics, summary: str, issued_at: datetime, seal: AuditSeal) -> bytes:
    """Genera el PDF completo del reporte y devuelve sus bytes."""
    buffer = BytesIO()
    issued_text = issued_at.strftime("%d/%m/%Y %H:%M UTC")
    paint = partial(_paint_page, issued_at=issued_text, seal=seal)
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=34 * mm,
        bottomMargin=30 * mm,
        title="Reporte de productividad TaskMate AI",
        author="TaskMate AI",
    )
    document.build(_story(metrics, summary), onFirstPage=paint, onLaterPages=paint)

    return buffer.getvalue()
