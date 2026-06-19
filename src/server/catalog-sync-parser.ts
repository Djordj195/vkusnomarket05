import "server-only";

export type ParsedRow = Record<string, string>;

export type ParseResult = {
  ok: boolean;
  rows: ParsedRow[];
  columns: string[];
  error?: string;
};

export function detectFormat(content: string, contentType?: string): "csv" | "json" | "xml" | null {
  if (contentType?.includes("json") || content.trimStart().startsWith("[") || content.trimStart().startsWith("{")) {
    return "json";
  }
  if (contentType?.includes("xml") || content.trimStart().startsWith("<?xml") || content.trimStart().startsWith("<")) {
    return "xml";
  }
  if (contentType?.includes("csv") || content.includes(",") || content.includes(";") || content.includes("\t")) {
    return "csv";
  }
  return null;
}

export function parseContent(content: string, format?: string | null): ParseResult {
  const detected = format || detectFormat(content);
  switch (detected) {
    case "json":
      return parseJson(content);
    case "csv":
      return parseCsv(content);
    case "xml":
      return parseXml(content);
    default:
      return { ok: false, rows: [], columns: [], error: "Формат файла не распознан" };
  }
}

function parseJson(content: string): ParseResult {
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || parsed.data || [parsed]);
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: false, rows: [], columns: [], error: "JSON не содержит массив товаров" };
    }
    const rows: ParsedRow[] = arr.map((item) => {
      const row: ParsedRow = {};
      for (const [key, val] of Object.entries(item)) {
        row[key] = val == null ? "" : String(val);
      }
      return row;
    });
    const columns = Object.keys(rows[0] ?? {});
    return { ok: true, rows, columns };
  } catch {
    return { ok: false, rows: [], columns: [], error: "Невалидный JSON" };
  }
}

function parseCsv(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { ok: false, rows: [], columns: [], error: "CSV пустой или содержит только заголовок" };
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    const row: ParsedRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim();
    }
    rows.push(row);
  }

  return { ok: true, rows, columns: headers };
}

function detectCsvDelimiter(headerLine: string): string {
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  for (const ch of headerLine) {
    if (ch in counts) counts[ch]++;
  }
  if (counts[";"] > counts[","] && counts[";"] > counts["\t"]) return ";";
  if (counts["\t"] > counts[","]) return "\t";
  return ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseXml(content: string): ParseResult {
  try {
    const itemRegex = /<(?:item|product|offer)[^>]*>([\s\S]*?)<\/(?:item|product|offer)>/gi;
    const fieldRegex = /<([a-zA-Z_][a-zA-Z0-9_]*)(?:\s[^>]*)?>([^<]*)<\/\1>/g;
    const rows: ParsedRow[] = [];
    const columnsSet = new Set<string>();
    let match;

    while ((match = itemRegex.exec(content)) !== null) {
      const row: ParsedRow = {};
      let fieldMatch;
      fieldRegex.lastIndex = 0;
      const block = match[1];
      while ((fieldMatch = fieldRegex.exec(block)) !== null) {
        const key = fieldMatch[1];
        row[key] = fieldMatch[2].trim();
        columnsSet.add(key);
      }
      if (Object.keys(row).length > 0) rows.push(row);
    }

    if (rows.length === 0) {
      return { ok: false, rows: [], columns: [], error: "XML не содержит распознаваемых товаров" };
    }

    return { ok: true, rows, columns: Array.from(columnsSet) };
  } catch {
    return { ok: false, rows: [], columns: [], error: "Невалидный XML" };
  }
}
