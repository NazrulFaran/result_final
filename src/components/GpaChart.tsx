import type { SemesterResult } from "../utils/grading";

type Props = {
  semesters: SemesterResult[];
  cgpa: number | null;
};

function shortLabel(lt: string): string {
  const lvl = lt.match(/Level\s*(\d)/i)?.[1] ?? "?";
  const term = lt.match(/Term\s*(I{1,3}|IV|V?\d*)/i)?.[1] ?? "?";
  const termNum =
    term === "I" ? "1" :
    term === "II" ? "2" :
    term === "III" ? "3" :
    term === "IV" ? "4" : term;
  return `L${lvl}T${termNum}`;
}

const BAR_COLORS = [
  "#06b6d4", "#38bdf8", "#34d399", "#a3e635",
  "#fb923c", "#f472b6", "#818cf8", "#2dd4bf",
];

export default function GpaChart({ semesters, cgpa }: Props) {
  const published = semesters.filter((s) => s.gpa !== null);

  if (published.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-teal-100 p-8 shadow-md text-center">
        <p className="text-gray-500 text-sm">No results published yet</p>
      </div>
    );
  }

  const maxGpa = 4.0;
  const chartHeight = 240;
  const barWidth = 48;
  const gap = 20;
  const padLeft = 48;
  const padBottom = 48;
  const padTop = 24;
  const padRight = 20;

  const svgWidth = padLeft + published.length * (barWidth + gap) - gap + padRight;
  const svgHeight = chartHeight + padBottom + padTop;

  const yLines = [0, 1, 2, 3, 4];

  return (
    <div className="bg-white rounded-xl border border-teal-100 p-6 shadow-md">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">GPA Progression</h3>
          <p className="text-sm text-gray-500 mt-1">Semester-wise performance</p>
        </div>
        {cgpa !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold text-teal-600">{cgpa.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Cumulative GPA</div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="mx-auto"
          style={{ minWidth: "100%" }}
        >
          {yLines.map((v) => {
            const y = padTop + chartHeight - (v / maxGpa) * chartHeight;
            return (
              <g key={v}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray={v === 0 ? "0" : "4 3"}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={12}
                  fill="#9ca3af"
                  fontWeight="500"
                >
                  {v}.0
                </text>
              </g>
            );
          })}

          {published.map((sem, i) => {
            const barH = (sem.gpa! / maxGpa) * chartHeight;
            const x = padLeft + i * (barWidth + gap);
            const y = padTop + chartHeight - barH;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            const label = shortLabel(sem.levelTerm);

            return (
              <g key={sem.levelTerm}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  ry={6}
                  fill={color}
                  opacity={0.9}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight="700"
                  fill={color}
                >
                  {sem.gpa!.toFixed(2)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={padTop + chartHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#6b7280"
                  fontWeight="500"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {cgpa !== null && published.length > 1 && (
            <>
              <line
                x1={padLeft}
                y1={padTop + chartHeight - (cgpa / maxGpa) * chartHeight}
                x2={padLeft + (published.length - 1) * (barWidth + gap) + barWidth}
                y2={padTop + chartHeight - (cgpa / maxGpa) * chartHeight}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 4"
                opacity={0.8}
              />
              <text
                x={padLeft + (published.length - 1) * (barWidth + gap) + barWidth + 8}
                y={padTop + chartHeight - (cgpa / maxGpa) * chartHeight + 4}
                fontSize={11}
                fill="#f59e0b"
                fontWeight="600"
              >
                CGPA {cgpa.toFixed(2)}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
        {semesters.map((sem, i) => (
          <div key={sem.levelTerm} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length], opacity: sem.gpa !== null ? 0.9 : 0.3 }}
            />
            <span className={`text-xs ${sem.gpa !== null ? "text-gray-700 font-medium" : "text-gray-400"}`}>
              {shortLabel(sem.levelTerm)}
              {sem.gpa !== null ? ` (${sem.gpa.toFixed(2)})` : " (pending)"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
