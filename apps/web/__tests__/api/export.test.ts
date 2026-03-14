/**
 * Unit tests for the CSV helper used in the export API.
 * We test the helper in isolation rather than the full route handler
 * to avoid needing a database in unit tests.
 */

// Replicate the toCSV helper so we can test it without importing the full route
// (which has Prisma/NextAuth server dependencies).
function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v).replace(/\r?\n/g, " ");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

describe("toCSV export helper", () => {
  it("returns empty string for empty array", () => {
    expect(toCSV([])).toBe("");
  });

  it("outputs header row from object keys", () => {
    const csv = toCSV([{ name: "DT", date: "2024-01-01" }]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,date");
  });

  it("outputs data row", () => {
    const csv = toCSV([{ name: "DT", date: "2024-01-01" }]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("DT,2024-01-01");
  });

  it("wraps values containing commas in double quotes", () => {
    const csv = toCSV([{ notes: "heavy, sweaty" }]);
    expect(csv).toContain('"heavy, sweaty"');
  });

  it("escapes double-quote characters in values", () => {
    const csv = toCSV([{ notes: 'said "hello"' }]);
    expect(csv).toContain('"said ""hello"""');
  });

  it("replaces newlines in values with spaces", () => {
    const csv = toCSV([{ notes: "line1\nline2" }]);
    expect(csv).toContain("line1 line2");
  });

  it("renders null values as empty string", () => {
    const csv = toCSV([{ weight: null }]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("");
  });

  it("renders multiple rows", () => {
    const csv = toCSV([
      { title: "Fran", date: "2024-01-01" },
      { title: "DT", date: "2024-01-15" },
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("Fran,2024-01-01");
    expect(lines[2]).toBe("DT,2024-01-15");
  });
});
