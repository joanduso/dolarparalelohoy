#!/usr/bin/env python3
"""Resume un ZIP de Rendimiento de Search Console y compara ventanas de 28 días.

Solo usa la biblioteca estándar. No extrae ni guarda las filas del ZIP.
"""

import argparse
import csv
import hashlib
import io
import json
import sys
import unicodedata
import zipfile
from datetime import date, timedelta
from pathlib import Path


def rows(archive: zipfile.ZipFile, filename: str) -> list[dict[str, str]]:
    try:
        content = archive.read(filename).decode("utf-8-sig")
    except KeyError as error:
        raise ValueError(f"Falta {filename} en el ZIP") from error
    return list(csv.DictReader(io.StringIO(content)))


def clean(value: str) -> str:
    return " ".join(value.split())


def normalize_query(value: str) -> str:
    return "".join(
        letter
        for letter in unicodedata.normalize("NFKD", value.casefold())
        if not unicodedata.combining(letter)
    ).strip()


def metrics(day_rows: list[dict]) -> dict:
    impressions = sum(row["impressions"] for row in day_rows)
    clicks = sum(row["clicks"] for row in day_rows)
    weighted_position = (
        sum(row["impressions"] * row["position"] for row in day_rows) / impressions
        if impressions
        else None
    )
    return {
        "from": day_rows[0]["date"].isoformat(),
        "to": day_rows[-1]["date"].isoformat(),
        "days": len(day_rows),
        "clicks": clicks,
        "impressions": impressions,
        "ctr_pct": round(100 * clicks / impressions, 4) if impressions else None,
        # Estimación: el CSV diario ya redondea la posición a una decimal.
        "average_position_estimate": round(weighted_position, 1)
        if weighted_position is not None
        else None,
    }


def snapshot(zip_path: Path) -> dict:
    with zipfile.ZipFile(zip_path) as archive:
        filters = {
            clean(row["Filtrar"]): clean(row["Valor"])
            for row in rows(archive, "Filtros.csv")
        }
        chart_rows = rows(archive, "Gráfico.csv")
        required = {"Fecha", "Clics", "Impresiones", "Posición"}
        if not chart_rows or not required.issubset(chart_rows[0]):
            raise ValueError("Gráfico.csv está vacío o carece de columnas necesarias")

        daily = []
        for row in chart_rows:
            item = {
                "date": date.fromisoformat(row["Fecha"]),
                "clicks": int(row["Clics"]),
                "impressions": int(row["Impresiones"]),
                "position": float(row["Posición"]),
            }
            if item["clicks"] < 0 or item["impressions"] < 0:
                raise ValueError("Clics e impresiones deben ser no negativos")
            daily.append(item)
        daily.sort(key=lambda row: row["date"])
        if len({row["date"] for row in daily}) != len(daily):
            raise ValueError("Gráfico.csv contiene fechas duplicadas")
        if len(daily) < 28:
            raise ValueError("El ZIP necesita al menos 28 días completos")

        last_28 = daily[-28:]
        if any(
            later["date"] - earlier["date"] != timedelta(days=1)
            for earlier, later in zip(last_28, last_28[1:])
        ):
            raise ValueError("Los últimos 28 días tienen fechas faltantes")

        # Estos cortes describen todo el período exportado. En el ZIP inicial
        # son 83 días, así que NO se comparan con cortes de un ZIP de 28 días.
        countries = rows(archive, "Países.csv")
        bolivia = next((row for row in countries if row["País"] == "Bolivia"), None)
        queries = rows(archive, "Consultas.csv")
        blue_queries = [
            row
            for row in queries
            if normalize_query(row["Consultas principales"]) == "dolar blue hoy bolivia"
        ]
        context = {
            "bolivia": {
                "clicks": int(bolivia["Clics"]) if bolivia else 0,
                "impressions": int(bolivia["Impresiones"]) if bolivia else 0,
            },
            "blue_hoy_bolivia_visible": {
                "clicks": sum(int(row["Clics"]) for row in blue_queries),
                "impressions": sum(int(row["Impresiones"]) for row in blue_queries),
            },
            "visible_queries": {
                "clicks": sum(int(row["Clics"]) for row in queries),
                "impressions": sum(int(row["Impresiones"]) for row in queries),
            },
        }

    return {
        "schema_version": 1,
        "source_sha256": hashlib.sha256(zip_path.read_bytes()).hexdigest(),
        "filters": filters,
        "full_period": metrics(daily),
        "last_28_days": metrics(last_28),
        "full_period_context": context,
    }


def compare(baseline: dict, current: dict) -> str:
    old_filters = {k: v for k, v in baseline["filters"].items() if k != "Fecha"}
    new_filters = {k: v for k, v in current["filters"].items() if k != "Fecha"}
    if old_filters != new_filters:
        raise ValueError("Los filtros difieren (aparte de Fecha); no se puede comparar")
    before = baseline["last_28_days"]
    after = current["last_28_days"]
    if before["days"] != 28 or after["days"] != 28:
        raise ValueError("La comparación requiere dos ventanas de 28 días")
    if date.fromisoformat(after["to"]) <= date.fromisoformat(before["to"]):
        raise ValueError("El ZIP nuevo no termina después de la línea base")

    gap = (date.fromisoformat(after["from"]) - date.fromisoformat(before["to"])).days - 1
    relation = (
        "ventanas consecutivas"
        if gap == 0
        else f"{gap} días sin cubrir entre ventanas"
        if gap > 0
        else f"{abs(gap)} días superpuestos entre ventanas"
    )
    lines = [
        f"Base:  {before['from']} a {before['to']}",
        f"Nuevo: {after['from']} a {after['to']} ({relation})",
        f"Clics: {before['clicks']} → {after['clicks']} ({after['clicks'] - before['clicks']:+d})",
        f"Impresiones: {before['impressions']} → {after['impressions']} "
        f"({after['impressions'] - before['impressions']:+d})",
    ]
    if before["ctr_pct"] is not None and after["ctr_pct"] is not None:
        delta = after["ctr_pct"] - before["ctr_pct"]
        lines.append(
            f"CTR: {before['ctr_pct']:.3f}% → {after['ctr_pct']:.3f}% "
            f"({delta:+.3f} puntos porcentuales)"
        )
    if before["average_position_estimate"] is not None and after["average_position_estimate"] is not None:
        lines.append(
            "Posición media estimada: "
            f"{before['average_position_estimate']:.1f} → "
            f"{after['average_position_estimate']:.1f}"
        )
    if baseline["full_period"]["days"] != 28 or current["full_period"]["days"] != 28:
        lines.append("Países y consultas: períodos exportados de distinta duración; sin comparación.")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zip", type=Path, help="ZIP exportado de Search Console")
    parser.add_argument("--output", type=Path, help="guardar resumen derivado en JSON")
    parser.add_argument("--compare", type=Path, help="JSON de la línea base anterior")
    args = parser.parse_args()
    try:
        report = snapshot(args.zip)
        comparison = None
        if args.compare:
            baseline = json.loads(args.compare.read_text(encoding="utf-8"))
            comparison = compare(baseline, report)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(
                json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
        period = report["last_28_days"]
        ctr = f"{period['ctr_pct']:.3f}%" if period["ctr_pct"] is not None else "sin impresiones"
        print(
            f"Últimos 28 días: {period['from']} a {period['to']}; "
            f"{period['clicks']} clics, {period['impressions']} impresiones, "
            f"CTR {ctr}"
        )
        if comparison:
            print(comparison)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
