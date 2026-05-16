"""
Chart Generator - Genera imágenes PNG de gráficos de gastos mensuales.
Usa matplotlib con estilo oscuro premium.
"""

import io
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional
import matplotlib
matplotlib.use("Agg")  # Backend no-interactivo para generar imágenes
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

logger = logging.getLogger(__name__)

# Paleta de colores Neo-Brutalista
COLORS = [
    "#FF3366",  # Rosa Fuerte
    "#00CC66",  # Verde
    "#FFB800",  # Amarillo
    "#3366FF",  # Azul
    "#9933FF",  # Morado
    "#00E5FF",  # Cyan
    "#FF6600",  # Naranja
    "#FF99CC",  # Rosa Claro
    "#CCFF00",  # Lima
    "#FFFFFF",  # Blanco
]

BG_COLOR = "#0B241C"  # Verde Bosque Profundo
CARD_COLOR = "#05120E"
TEXT_COLOR = "#F4F4F0"
BORDER_COLOR = "#0B0B0B"
ACCENT_GREEN = "#00CC66"


def generate_monthly_chart(
    by_category: list[dict],
    month: int,
    year: int,
    total_usd: float,
    username: str = "Usuario",
) -> Optional[bytes]:
    """
    Genera un gráfico PNG compuesto:
    - Gráfico de torta a la izquierda con distribución por categoría
    - Barras de presupuesto a la derecha

    Retorna bytes del PNG o None si hay error.
    """
    try:
        logger.info(f"Generating chart for {username} - month {month}/{year}, total ${total_usd}")
        
        # Filtrar categorías con gastos
        categories = [c for c in by_category if c.get("spent_usd", 0) > 0]
        logger.info(f"Categories with spending: {categories}")
        
        if not categories:
            return _generate_empty_chart(month, year)
    except Exception as e:
        logger.error(f"Error before chart generation: {e}")
        return _generate_empty_chart(month, year)

        # Ordenar por gasto descendente
        categories.sort(key=lambda x: x["spent_usd"], reverse=True)

        # Limitar a top 9 + "Otros"
        if len(categories) > 9:
            top = categories[:9]
            others_total = sum(c["spent_usd"] for c in categories[9:])
            top.append({
                "category_name": "Otros",
                "spent_usd": others_total,
                "budget_usd": None,
                "percentage": None,
                "status": "none",
            })
            categories = top

        labels = [c["category_name"] for c in categories]
        sizes = [c["spent_usd"] for c in categories]
        colors = COLORS[:len(categories)]

        month_name = _month_name(month)
        fig = plt.figure(figsize=(12, 7), facecolor=BG_COLOR)
        fig.patch.set_facecolor(BG_COLOR)

        # --- Layout: 2 subplots ---
        ax_pie = fig.add_axes([0.02, 0.1, 0.42, 0.8])
        ax_bar = fig.add_axes([0.52, 0.08, 0.45, 0.75])

        # ---- TORTA (Estilo Neo-Brutalista) ----
        wedge_props = {"linewidth": 2.5, "edgecolor": BORDER_COLOR}
        wedges, texts, autotexts = ax_pie.pie(
            sizes,
            colors=colors,
            autopct=lambda p: f"{p:.1f}%" if p > 3 else "",
            pctdistance=0.75,
            wedgeprops=wedge_props,
            startangle=90,
        )
        for autotext in autotexts:
            autotext.set_color(TEXT_COLOR)
            autotext.set_fontsize(10)
            autotext.set_fontweight("black")
            autotext.set_path_effects([matplotlib.patheffects.withStroke(linewidth=3, foreground=BORDER_COLOR)])

        ax_pie.set_facecolor(BG_COLOR)

        # Leyenda de la torta
        legend_patches = [
            mpatches.Patch(
                facecolor=colors[i], 
                edgecolor=BORDER_COLOR, 
                linewidth=1.5,
                label=f"{labels[i][:15]}  ${sizes[i]:.2f}"
            )
            for i in range(len(labels))
        ]
        ax_pie.legend(
            handles=legend_patches,
            loc="lower center",
            bbox_to_anchor=(0.5, -0.22),
            ncol=2,
            frameon=True,
            facecolor=CARD_COLOR,
            edgecolor=BORDER_COLOR,
            labelcolor=TEXT_COLOR,
            fontsize=9,
        )

        # ---- BARRAS DE PRESUPUESTO ----
        ax_bar.set_facecolor(BG_COLOR)
        ax_bar.spines['top'].set_visible(False)
        ax_bar.spines['right'].set_visible(False)
        ax_bar.spines['bottom'].set_linewidth(2)
        ax_bar.spines['left'].set_linewidth(2)
        ax_bar.spines['bottom'].set_color(TEXT_COLOR)
        ax_bar.spines['left'].set_color(TEXT_COLOR)
        ax_bar.tick_params(colors=TEXT_COLOR, labelsize=9, width=2)

        bar_cats = [c for c in categories if c.get("budget_usd")]
        if bar_cats:
            bar_labels = [c["category_name"][:14] for c in bar_cats]
            bar_spent = [c["spent_usd"] for c in bar_cats]
            bar_budget = [c["budget_usd"] for c in bar_cats]
            bar_colors = []
            for c in bar_cats:
                status = c.get("status", "none")
                if status == "red":
                    bar_colors.append("#FF3333")
                elif status == "yellow":
                    bar_colors.append("#FFB800")
                else:
                    bar_colors.append("#00CC66")

            y_pos = range(len(bar_cats))
            # Límite (fondo de la barra)
            ax_bar.barh(y_pos, bar_budget, color=CARD_COLOR, edgecolor=BORDER_COLOR, linewidth=2, height=0.6, label="Límite")
            # Gastado (frente de la barra)
            ax_bar.barh(y_pos, bar_spent, color=bar_colors, edgecolor=BORDER_COLOR, linewidth=2, height=0.6, label="Gastado")

            ax_bar.set_yticks(list(y_pos))
            ax_bar.set_yticklabels(bar_labels, color=TEXT_COLOR, fontweight="bold")
            ax_bar.xaxis.set_tick_params(labelcolor=TEXT_COLOR)

            # Añadir porcentaje al final de cada barra
            for i, c in enumerate(bar_cats):
                pct = c.get("percentage", 0) or 0
                ax_bar.text(
                    bar_spent[i] + max(bar_budget) * 0.02,
                    i,
                    f"{pct:.0f}%",
                    va="center",
                    color=TEXT_COLOR,
                    fontsize=9,
                    fontweight="black",
                    path_effects=[matplotlib.patheffects.withStroke(linewidth=3, foreground=BORDER_COLOR)]
                )

            ax_bar.set_title(
                "Presupuestos del Mes",
                color=TEXT_COLOR,
                fontsize=12,
                fontweight="black",
                pad=15,
            )
        else:
            ax_bar.text(
                0.5, 0.5,
                "Sin presupuestos configurados",
                ha="center", va="center",
                color=TEXT_COLOR,
                fontsize=12,
                fontweight="bold",
                transform=ax_bar.transAxes,
                bbox=dict(facecolor=CARD_COLOR, edgecolor=BORDER_COLOR, boxstyle='square,pad=1', linewidth=2)
            )

        # ---- TÍTULO PRINCIPAL ----
        fig.suptitle(
            f"CHURUPO TRACKER • {username.upper()}",
            color=TEXT_COLOR,
            fontsize=16,
            fontweight="black",
            y=0.98,
        )
        fig.text(
            0.5, 0.92,
            f"{month_name} {year}  |  TOTAL: ${total_usd:.2f}",
            ha="center",
            color=TEXT_COLOR,
            fontsize=12,
            fontweight="bold",
            bbox=dict(facecolor=ACCENT_GREEN, edgecolor=BORDER_COLOR, boxstyle='square,pad=0.5', linewidth=2)
        )

        # Guardar en bytes
        buf = io.BytesIO()
        plt.savefig(
            buf,
            format="png",
            dpi=140,
            bbox_inches="tight",
            facecolor=BG_COLOR,
            edgecolor="none",
        )
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()

    except Exception as e:
        logger.error(f"Error generating chart with matplotlib: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        plt.close("all")
        
        # Fallback: generar chart simple con Pillow
        try:
            return _generate_fallback_chart(by_category, month, year, total_usd, username)
        except Exception as fallback_error:
            logger.error(f"Fallback also failed: {fallback_error}")
            return None


def _generate_empty_chart(month: int, year: int) -> bytes:
    """Gráfico vacío cuando no hay datos."""
    fig, ax = plt.subplots(figsize=(8, 4), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.spines[:].set_visible(False)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.text(
        0.5, 0.55,
        "📭",
        ha="center", va="center",
        fontsize=40,
        transform=ax.transAxes,
    )
    ax.text(
        0.5, 0.35,
        f"Sin transacciones registradas\n{_month_name(month)} {year}",
        ha="center", va="center",
        color=TEXT_COLOR,
        fontsize=13,
        fontweight="bold",
        transform=ax.transAxes,
    )
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=120, bbox_inches="tight", facecolor=BG_COLOR)
    buf.seek(0)
    plt.close(fig)
    return buf.getvalue()


def _month_name(month: int) -> str:
    months = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    return months[month] if 1 <= month <= 12 else "?"


def _generate_fallback_chart(
    by_category: list[dict],
    month: int,
    year: int,
    total_usd: float,
    username: str,
) -> bytes:
    """Genera un gráfico simple de texto como fallback."""
    from PIL import Image, ImageDraw, ImageFont
    
    width, height = 600, 400
    img = Image.new("RGB", (width, height), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    except:
        font_title = ImageFont.load_default()
        font_normal = ImageFont.load_default()
    
    month_name = _month_name(month)
    
    draw.text((300, 30), f"CHURUPO TRACKER - {username.upper()}", fill=TEXT_COLOR, anchor="mm", font=font_title)
    draw.text((300, 70), f"{month_name} {year} | Total: ${total_usd:.2f}", fill=TEXT_COLOR, anchor="mm", font=font_normal)
    
    y = 120
    categories = [c for c in by_category if c.get("spent_usd", 0) > 0][:8]
    for c in categories:
        cat_name = c.get("category_name", "Sin categoría")[:20]
        spent = c.get("spent_usd", 0)
        pct = c.get("percentage") or 0
        color = ACCENT_GREEN if pct < 80 else ("#FFB800" if pct < 100 else "#FF3333")
        
        draw.text((50, y), f"{cat_name}", fill=TEXT_COLOR, font=font_normal)
        draw.text((400, y), f"${spent:.2f}", fill=color, font=font_normal)
        y += 30
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()
