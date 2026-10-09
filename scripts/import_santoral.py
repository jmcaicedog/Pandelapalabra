"""Import nominal saint names and review metadata, never annual liturgical rules."""
import argparse
import datetime
import json
import posixpath
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def import_workbook(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = [
                "".join(node.itertext())
                for node in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", NS)
            ]
        relationships = {
            node.attrib["Id"]: node.attrib["Target"]
            for node in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        }
        sheets = {}
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            target = relationships[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else posixpath.normpath(f"xl/{target}")
            rows = []
            for row in ET.fromstring(archive.read(target)).findall("m:sheetData/m:row", NS):
                cells = {}
                for cell in row.findall("m:c", NS):
                    value = cell.find("m:v", NS)
                    inline = cell.find("m:is", NS)
                    text = value.text or "" if value is not None else (
                        "".join(inline.itertext()) if inline is not None else ""
                    )
                    if cell.attrib.get("t") == "s":
                        text = strings[int(text)]
                    cells["".join(filter(str.isalpha, cell.attrib["r"]))] = text
                rows.append(cells)
            sheets[sheet.attrib["name"]] = rows
    entries = {}
    for row in sheets["Santoral permanente"][1:]:
        key = row["A"]
        if key in entries:
            raise ValueError(f"Duplicate month-day: {key}")
        entries[key] = {
            "name": row["C"], "kind": "calendar", "rank": row["B"],
            "source": "Calendario propio de Colombia; base editorial aportada",
            "review": row.get("E") or "Cotejo editorial pendiente",
        }
    for row in sheets["Santoral complementario"][1:]:
        key = row["A"]
        if key in entries:
            raise ValueError(f"Duplicate month-day: {key}")
        entries[key] = {
            "name": row["B"], "kind": "complementary", "rank": "",
            "source": row["D"], "review": row["E"],
        }
    expected = {
        (datetime.date(2028, 1, 1) + datetime.timedelta(days=n)).strftime("%m-%d")
        for n in range(366)
    }
    if set(entries) != expected or any(not entry["name"].strip() for entry in entries.values()):
        raise ValueError("Expected exactly 366 nonempty recurring month-day entries")
    return {"version": "colombia-editorial-v1.0.2", "workbook": Path(path).name,
            "entries": dict(sorted(entries.items()))}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = import_workbook(args.workbook)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(data['entries'])} recurring entries into {args.output}")
