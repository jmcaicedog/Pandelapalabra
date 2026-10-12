"""Import editorial biography summaries from the named worksheet in a source workbook."""
import argparse
import datetime
import json
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
SHEET_NAME = "Reseñas biográficas"
HEADERS = {
    "Fecha": "date",
    "Santo o celebración": "name",
    "Reseña original breve": "text",
    "Tipo de reseña": "type",
    "Estado editorial": "status",
    "Fuente de verificación": "source",
}


def import_workbook(path):
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        strings = []
        if "xl/sharedStrings.xml" in names:
            shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(item.itertext()) for item in shared.findall("m:si", NS)]
        relationships = {
            node.attrib["Id"]: node.attrib["Target"]
            for node in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        }
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next(
            (item for item in workbook.findall("m:sheets/m:sheet", NS)
             if item.attrib["name"] == SHEET_NAME),
            None,
        )
        if sheet is None:
            raise ValueError(f"Missing worksheet: {SHEET_NAME}")
        target = relationships[sheet.attrib[f"{{{REL}}}id"]]
        target = target.lstrip("/") if target.startswith("/") else posixpath.normpath(f"xl/{target}")
        root = ET.fromstring(archive.read(target))
        rows = []
        for row in root.findall("m:sheetData/m:row", NS):
            cells = {}
            for cell in row.findall("m:c", NS):
                value = cell.find("m:v", NS)
                inline = cell.find("m:is", NS)
                text = (value.text or "") if value is not None else (
                    "".join(inline.itertext()) if inline is not None else ""
                )
                if cell.attrib.get("t") == "s":
                    text = strings[int(text)]
                column = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                cells[column] = text
            rows.append(cells)

    if not rows:
        raise ValueError("Biography worksheet is empty")
    headers = {
        column: value.strip()
        for column, value in rows[0].items()
        if value.strip() in HEADERS
    }
    if set(headers.values()) != set(HEADERS):
        raise ValueError("Biography worksheet is missing required columns")
    columns = {target: column for column, target in (
        (column, HEADERS[header]) for column, header in headers.items()
    )}
    records = {}
    for row in rows[1:]:
        item = {
            field: row.get(column, "").strip()
            for field, column in columns.items()
        }
        date = item.pop("date")
        try:
            parsed = datetime.date.fromisoformat(date)
        except ValueError as error:
            raise ValueError(f"Invalid biography date: {date}") from error
        if parsed.year != 2026 or parsed.isoformat() != date:
            raise ValueError(f"Expected a YYYY-MM-DD date in 2026: {date}")
        key = parsed.strftime("%m-%d")
        if key in records:
            raise ValueError(f"Duplicate biography date: {key}")
        if not all(item.values()):
            raise ValueError(f"Incomplete biography row: {date}")
        excluded = (
            item["status"].startswith("ALERTA:")
            or item["type"] == "Corrección requerida"
            or re.search(
                r"llama erróneamente|no corresponde a la memoria|requiere corrección antes de publicar",
                item["text"],
                re.IGNORECASE,
            )
        )
        records[key] = {
            "name": item["name"],
            "text": item["text"],
            "excluded": bool(excluded),
        }

    expected = {
        (datetime.date(2026, 1, 1) + datetime.timedelta(days=offset)).strftime("%m-%d")
        for offset in range(365)
    }
    if set(records) != expected:
        missing = sorted(expected - set(records))
        extra = sorted(set(records) - expected)
        raise ValueError(f"Expected all 365 days of 2026; missing={missing}, extra={extra}")

    version_match = re.search(r"_(20\d{2})_(V\d+(?:_\d+)*)_", Path(path).name, re.IGNORECASE)
    if not version_match:
        raise ValueError("Workbook filename must include year and version, e.g. _2026_V1_0_4_")
    version = f"colombia-biographies-{version_match.group(1)}-{version_match.group(2).replace('_', '.').lower()}"
    return {
        "version": version,
        "workbook": Path(path).name,
        "sheet": SHEET_NAME,
        "records": dict(sorted(records.items())),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = import_workbook(args.workbook)
    args.output.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Imported {len(data['records'])} biography reviews into {args.output}")
