import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getCaptcha, loginAndFetch } from "@/lib/cuet.functions";
import { CATALOG, normalizeCode } from "@/lib/courseCatalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  GraduationCap,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Target,
  Award,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Eye,
  EyeOff,
  UserPlus,
  Crown,
  Star,
  Clock,
  FolderOpen,
  Eraser,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Results = Awaited<ReturnType<typeof loginAndFetch>>;

// Storage keys
const STORAGE_KEYS = {
  MANUAL_RESULTS: "cuet_manual_results_v6",
  USER_PREFS: "cuet_user_prefs",
  SEMESTER_GPA_PREFIX: "semester_gpa_",
};

interface ManualCourse {
  id: string;
  code: string;
  name: string;
  grade: string;
  credit: number;
  sessional: boolean;
  levelTerm: string;
  source: "manual";
}

interface FetchedCourse {
  code: string;
  name: string;
  grade: string;
  credit: number;
  sessional: boolean;
  levelTerm: string;
  source: "fetched";
}

type Course = FetchedCourse | ManualCourse;

interface UserPrefs {
  targetGPA: number;
}

// Grade point mapping
const getGradePoint = (grade: string): number => {
  const points: Record<string, number> = {
    "A+": 4.00,
    "A": 3.75,
    "A-": 3.50,
    "B+": 3.25,
    "B": 3.00,
    "B-": 2.75,
    "C+": 2.50,
    "C": 2.25,
    "D": 2.00,
    "F": 0.00,
  };
  return points[grade] || 0;
};

// Helper to round to 3 decimal places
const roundTo3Decimals = (num: number): number => {
  return Math.round(num * 1000) / 1000;
};

const GRADE_ORDER = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];
const GRADE_COLORS: Record<string, string> = {
  "A+": "#06b6d4",
  "A": "#22d3ee",
  "A-": "#67e8f9",
  "B+": "#8b5cf6",
  "B": "#a78bfa",
  "B-": "#c4b5fd",
  "C+": "#f59e0b",
  "C": "#fbbf24",
  "D": "#f97316",
  "F": "#ef4444",
};

// Function to validate student ID (must contain "08" for ETE department)
const isValidStudentId = (id: string): boolean => {
  return id.includes("08");
};

function Index() {
  const fetchCaptcha = useServerFn(getCaptcha);
  const submitLogin = useServerFn(loginAndFetch);

  const [captcha, setCaptcha] = useState<{ image: string; cookie: string; csrf: string } | null>(null);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Extract<Results, { ok: true }> | null>(null);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setError(null);
    try {
      const c = await fetchCaptcha();
      setCaptcha(c);
      setCaptchaText("");
    } catch (e: any) {
      const msg = e?.message || e?.toString() || "Failed to load captcha";
      setError(msg);
      setCaptcha(null);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (!data) loadCaptcha();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha) return;
    
    if (!isValidStudentId(studentId)) {
      setError("This portal is only for Electronics and Telecommunication Engineering Department students.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await submitLogin({
        data: {
          studentId: studentId.trim(),
          password,
          captcha: captchaText.trim(),
          cookie: captcha.cookie,
          csrf: captcha.csrf,
        },
      });
      if (!res.ok) {
        setError(res.error);
        await loadCaptcha();
      } else {
        setData(res);
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    return <Dashboard data={data} onLogout={() => setData(null)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-xl text-white">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            CUET Result Visualizer
          </CardTitle>
          <p className="text-sm text-white/70">Track your academic performance at a glance</p>
          <p className="text-xs text-cyan-300 bg-cyan-500/20 rounded-lg p-2 mt-2">
            🎓 Only for Electronics & Telecommunication Engineering Department
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sid" className="text-white/80 text-sm font-medium">
                Student ID
              </Label>
              <Input
                id="sid"
                inputMode="numeric"
                placeholder="e.g., 2108005"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoComplete="off"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw" className="text-white/80 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap" className="text-white/80 text-sm font-medium">
                Captcha
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-12 rounded-lg border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                  {captchaLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                  ) : captcha ? (
                    <img src={captcha.image} alt="captcha" className="h-full object-contain" />
                  ) : (
                    <span className="text-xs text-red-300 px-2 text-center">Failed to load — click ↻ to retry</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={loadCaptcha}
                  disabled={captchaLoading}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <Input
                id="cap"
                placeholder="Enter captcha code"
                value={captchaText}
                onChange={(e) => setCaptchaText(e.target.value)}
                required
                autoComplete="off"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
              />
            </div>
            {error && <div className="text-sm text-red-300 bg-red-500/10 rounded-lg p-3 backdrop-blur-sm text-center">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 font-semibold shadow-lg transition-all"
              disabled={loading || !captcha}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching results...
                </>
              ) : (
                "Sign in & Fetch Results"
              )}
            </Button>
            <p className="text-xs text-white/50 text-center">
              Credentials are sent securely to course.cuet.ac.bd through our server. We do not store your data.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ data, onLogout }: { data: Extract<Results, { ok: true }>; onLogout: () => void }) {
  const [manualResults, setManualResults] = useState<ManualCourse[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.MANUAL_RESULTS);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [prefs, setPrefs] = useState<UserPrefs>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      return saved ? JSON.parse(saved) : { targetGPA: 3.5 };
    }
    return { targetGPA: 3.5 };
  });

  const [activeTab, setActiveTab] = useState("semesters");
  const [openSemesters, setOpenSemesters] = useState<Set<string>>(new Set());
  const [openManualSemesters, setOpenManualSemesters] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ManualCourse | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    grade: "A+",
    credit: 3,
    sessional: false,
    levelTerm: "",
  });
  const [targetGPA, setTargetGPA] = useState(prefs.targetGPA);
  
  const [tempGPAs, setTempGPAs] = useState<Map<string, string>>(() => {
    const temps = new Map<string, string>();
    if (typeof window !== "undefined") {
      for (const sem of CATALOG) {
        const saved = localStorage.getItem(`${STORAGE_KEYS.SEMESTER_GPA_PREFIX}${sem.levelTerm}`);
        if (saved) {
          temps.set(sem.levelTerm, parseFloat(saved).toFixed(3));
        }
      }
    }
    return temps;
  });
  
  const [semesterGPAOverrides, setSemesterGPAOverrides] = useState<Map<string, number>>(() => {
    const overrides = new Map<string, number>();
    if (typeof window !== "undefined") {
      for (const sem of CATALOG) {
        const saved = localStorage.getItem(`${STORAGE_KEYS.SEMESTER_GPA_PREFIX}${sem.levelTerm}`);
        if (saved) {
          overrides.set(sem.levelTerm, parseFloat(saved));
        }
      }
    }
    return overrides;
  });
  const [, forceUpdate] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify({ targetGPA }));
  }, [targetGPA]);

  useEffect(() => {
    const handleStorageChange = () => {
      const overrides = new Map<string, number>();
      const temps = new Map<string, string>();
      for (const sem of CATALOG) {
        const saved = localStorage.getItem(`${STORAGE_KEYS.SEMESTER_GPA_PREFIX}${sem.levelTerm}`);
        if (saved) {
          overrides.set(sem.levelTerm, parseFloat(saved));
          temps.set(sem.levelTerm, parseFloat(saved).toFixed(3));
        }
      }
      setSemesterGPAOverrides(overrides);
      setTempGPAs(temps);
      forceUpdate({});
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleSemester = (levelTerm: string) => {
    const newSet = new Set(openSemesters);
    if (newSet.has(levelTerm)) {
      newSet.delete(levelTerm);
    } else {
      newSet.add(levelTerm);
    }
    setOpenSemesters(newSet);
  };

  const toggleManualSemester = (key: string) => {
    const newSet = new Set(openManualSemesters);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setOpenManualSemesters(newSet);
  };

  const fetchedCourses: FetchedCourse[] = data.rows.map((row) => {
    const sem = CATALOG.find((s) => s.levelTerm === row.levelTerm);
    const cat = sem?.courses.find((c) => c.codes.some((code) => normalizeCode(code) === normalizeCode(row.code)));
    return {
      code: row.code,
      name: cat?.name ?? row.code,
      grade: row.grade,
      credit: row.credit,
      sessional: row.sessional,
      levelTerm: row.levelTerm,
      source: "fetched",
    };
  });

  const fetchedCourseKeys = new Set<string>();
  for (const fetched of fetchedCourses) {
    fetchedCourseKeys.add(`${normalizeCode(fetched.code)}|${fetched.levelTerm}`);
  }

  const manualOverrideMap = new Map<string, ManualCourse>();

  for (const manual of manualResults) {
    const key = `${normalizeCode(manual.code)}|${manual.levelTerm}`;
    manualOverrideMap.set(key, manual);
  }

  const finalCourses: Course[] = [];
  const processedKeys = new Set<string>();

  for (const fetched of fetchedCourses) {
    const key = `${normalizeCode(fetched.code)}|${fetched.levelTerm}`;
    const semesterOverride = semesterGPAOverrides.get(fetched.levelTerm);
    
    if (semesterOverride !== undefined) {
      processedKeys.add(key);
      continue;
    }
    
    const manualOverride = manualOverrideMap.get(key);
    if (manualOverride) {
      finalCourses.push({ ...manualOverride, source: "manual" });
      processedKeys.add(key);
    } else {
      finalCourses.push(fetched);
    }
  }

  for (const manual of manualResults) {
    const key = `${normalizeCode(manual.code)}|${manual.levelTerm}`;
    const semesterOverride = semesterGPAOverrides.get(manual.levelTerm);
    if (!processedKeys.has(key) && semesterOverride === undefined) {
      finalCourses.push(manual);
    }
  }

  const getSemesterTotalCredit = (levelTerm: string): number => {
    const semester = CATALOG.find(s => s.levelTerm === levelTerm);
    return semester?.totalCredit || 0;
  };

  const calculateAggregateWithOverrides = () => {
    const semesterMap = new Map<
      string,
      { totalPoints: number; totalCredits: number; courses: Course[]; isOverridden: boolean; overrideGPA: number | null }
    >();

    for (const semester of CATALOG) {
      semesterMap.set(semester.levelTerm, { totalPoints: 0, totalCredits: 0, courses: [], isOverridden: false, overrideGPA: null });
    }

    for (const course of finalCourses) {
      const semData = semesterMap.get(course.levelTerm);
      if (semData && !semData.isOverridden) {
        const gradePoint = getGradePoint(course.grade);
        semData.totalPoints += gradePoint * course.credit;
        semData.totalCredits += course.credit;
        semData.courses.push(course);
      }
    }

    for (const [levelTerm, overrideGPA] of semesterGPAOverrides.entries()) {
      const semData = semesterMap.get(levelTerm);
      if (semData) {
        const totalCredit = getSemesterTotalCredit(levelTerm);
        semData.isOverridden = true;
        semData.overrideGPA = overrideGPA;
        semData.totalPoints = overrideGPA * totalCredit;
        semData.totalCredits = totalCredit;
      }
    }

    const semesters = Array.from(semesterMap.entries())
      .map(([levelTerm, data]) => {
        let gpa = data.totalCredits > 0 ? data.totalPoints / data.totalCredits : 0;
        
        return {
          levelTerm,
          gpa: roundTo3Decimals(gpa),
          credits: data.totalCredits,
          courses: data.courses,
          isOverridden: data.isOverridden,
          overrideGPA: data.overrideGPA ? roundTo3Decimals(data.overrideGPA) : null,
          totalCredit: getSemesterTotalCredit(levelTerm),
        };
      })
      .sort((a, b) => {
        const order = ["I", "II", "III", "IV"];
        const getTerm = (lt: string) => lt.split(" ")[1] || "";
        return order.indexOf(getTerm(a.levelTerm)) - order.indexOf(getTerm(b.levelTerm));
      });

    let totalPoints = 0;
    let totalCredits = 0;
    for (const sem of semesters) {
      totalPoints += sem.gpa * sem.credits;
      totalCredits += sem.credits;
    }

    return {
      semesters,
      cgpa: totalCredits > 0 ? roundTo3Decimals(totalPoints / totalCredits) : 0,
      totalCredits,
    };
  };

  const agg = calculateAggregateWithOverrides();

  const resultMap = new Map<string, Course>();
  for (const course of finalCourses) {
    const semesterOverride = semesterGPAOverrides.get(course.levelTerm);
    if (semesterOverride === undefined) {
      resultMap.set(`${normalizeCode(course.code)}|${course.levelTerm}`, course);
    }
  }

  // Grade distribution for summary cards
  const distribution: Record<string, { theory: number; sessional: number; manual: number; fetched: number }> = {};
  GRADE_ORDER.forEach((g) => {
    distribution[g] = { theory: 0, sessional: 0, manual: 0, fetched: 0 };
  });

  for (const course of finalCourses) {
    const semesterOverride = semesterGPAOverrides.get(course.levelTerm);
    if (semesterOverride === undefined) {
      if (course.sessional) {
        distribution[course.grade].sessional++;
      } else {
        distribution[course.grade].theory++;
      }
      if (course.source === "manual") {
        distribution[course.grade].manual++;
      } else {
        distribution[course.grade].fetched++;
      }
    }
  }

  const chartData = GRADE_ORDER.filter((g) => {
    const d = distribution[g];
    return d.theory + d.sessional > 0;
  }).map((g) => ({
    grade: g,
    Theory: distribution[g].theory,
    Sessional: distribution[g].sessional,
    Manual: distribution[g].manual,
    Fetched: distribution[g].fetched,
    total: distribution[g].theory + distribution[g].sessional,
    color: GRADE_COLORS[g],
  }));

  const semesterMap = new Map(agg.semesters.map((s) => [s.levelTerm, s]));

  const calculateProjections = () => {
    let earnedPoints = 0;
    let earnedCredits = 0;

    for (const sem of agg.semesters) {
      earnedPoints += sem.gpa * sem.credits;
      earnedCredits += sem.credits;
    }

    let totalProgramCredits = 0;
    for (const sem of CATALOG) {
      totalProgramCredits += sem.totalCredit;
    }

    const remainingCredits = totalProgramCredits - earnedCredits;
    const currentCGPA = earnedCredits > 0 ? earnedPoints / earnedCredits : 0;
    const maxCGPA = (earnedPoints + remainingCredits * 4.0) / totalProgramCredits;

    const targetPoints = targetGPA * totalProgramCredits;
    const neededPoints = targetPoints - earnedPoints;
    const neededGPA = remainingCredits > 0 ? neededPoints / remainingCredits : 0;

    return {
      earnedCredits,
      remainingCredits,
      totalCredits: totalProgramCredits,
      currentCGPA: roundTo3Decimals(currentCGPA),
      maxCGPA: roundTo3Decimals(maxCGPA),
      neededGPA: roundTo3Decimals(neededGPA),
      isAchievable: neededGPA <= 4.0 && remainingCredits > 0 && neededPoints > 0,
    };
  };

  const projections = calculateProjections();

  const addManualCourse = () => {
    if (!formData.code || !formData.name || !formData.levelTerm) return;

    const newCourse: ManualCourse = {
      id: Date.now().toString(),
      ...formData,
      credit: Number(formData.credit),
      source: "manual",
    };

    const updated = [...manualResults, newCourse];
    setManualResults(updated);
    localStorage.setItem(STORAGE_KEYS.MANUAL_RESULTS, JSON.stringify(updated));
    setShowAddModal(false);
    setFormData({ code: "", name: "", grade: "A+", credit: 3, sessional: false, levelTerm: "" });
  };

  const updateManualCourse = () => {
    if (!editingCourse) return;

    const updated = manualResults.map((c) =>
      c.id === editingCourse.id ? { ...c, ...formData, credit: Number(formData.credit) } : c
    );
    setManualResults(updated);
    localStorage.setItem(STORAGE_KEYS.MANUAL_RESULTS, JSON.stringify(updated));
    setEditingCourse(null);
    setFormData({ code: "", name: "", grade: "A+", credit: 3, sessional: false, levelTerm: "" });
  };

  const deleteManualCourse = (id: string) => {
    const updated = manualResults.filter((c) => c.id !== id);
    setManualResults(updated);
    localStorage.setItem(STORAGE_KEYS.MANUAL_RESULTS, JSON.stringify(updated));
  };

  const hasManualOverride = (code: string, levelTerm: string): boolean => {
    return manualResults.some((m) => normalizeCode(m.code) === normalizeCode(code) && m.levelTerm === levelTerm);
  };

  const getManualOverride = (code: string, levelTerm: string): ManualCourse | undefined => {
    return manualResults.find((m) => normalizeCode(m.code) === normalizeCode(code) && m.levelTerm === levelTerm);
  };

  const handleTempGPAChange = (levelTerm: string, value: string) => {
    const newTemps = new Map(tempGPAs);
    newTemps.set(levelTerm, value);
    setTempGPAs(newTemps);
  };

  const handleSaveSemesterGPA = (levelTerm: string) => {
    const tempValue = tempGPAs.get(levelTerm);
    if (tempValue && tempValue !== "" && !isNaN(parseFloat(tempValue)) && parseFloat(tempValue) >= 0 && parseFloat(tempValue) <= 4) {
      const numValue = roundTo3Decimals(parseFloat(tempValue));
      localStorage.setItem(`${STORAGE_KEYS.SEMESTER_GPA_PREFIX}${levelTerm}`, numValue.toString());
      const overrides = new Map(semesterGPAOverrides);
      overrides.set(levelTerm, numValue);
      setSemesterGPAOverrides(overrides);
      const newTemps = new Map(tempGPAs);
      newTemps.set(levelTerm, numValue.toFixed(3));
      setTempGPAs(newTemps);
      forceUpdate({});
    } else if (!tempValue || tempValue === "") {
      handleClearSemesterGPA(levelTerm);
    }
  };

  const handleClearSemesterGPA = (levelTerm: string) => {
    localStorage.removeItem(`${STORAGE_KEYS.SEMESTER_GPA_PREFIX}${levelTerm}`);
    const overrides = new Map(semesterGPAOverrides);
    overrides.delete(levelTerm);
    setSemesterGPAOverrides(overrides);
    const newTemps = new Map(tempGPAs);
    newTemps.set(levelTerm, "");
    setTempGPAs(newTemps);
    forceUpdate({});
  };

  const totalCourses = finalCourses.length;
  const manualCoursesCount = manualResults.length;

  const getPendingCoursesForSemester = (levelTerm: string) => {
    const semesterOverride = semesterGPAOverrides.get(levelTerm);
    if (semesterOverride !== undefined) return [];
    
    const semester = CATALOG.find(s => s.levelTerm === levelTerm);
    if (!semester) return [];

    const pending: {
      code: string;
      name: string;
      credit: number;
      sessional: boolean;
      levelTerm: string;
      possibleCodes: string[];
      isElective: boolean;
    }[] = [];

    for (const course of semester.courses) {
      let isFound = false;
      for (const code of course.codes) {
        if (fetchedCourseKeys.has(`${normalizeCode(code)}|${levelTerm}`)) {
          isFound = true;
          break;
        }
      }
      for (const manual of manualResults) {
        for (const code of course.codes) {
          if (normalizeCode(manual.code) === normalizeCode(code) && manual.levelTerm === levelTerm) {
            isFound = true;
            break;
          }
        }
      }
      
      if (!isFound) {
        const isElective = course.name.toLowerCase().includes("elective");
        pending.push({
          code: isElective ? "Elective" : course.codes[0],
          name: course.name,
          credit: course.credit || 3,
          sessional: course.name.toLowerCase().includes("sessional") || course.name.toLowerCase().includes("lab"),
          levelTerm: levelTerm,
          possibleCodes: course.codes,
          isElective: isElective,
        });
      }
    }
    return pending;
  };

  const getManualEntriesBySemester = () => {
    const entriesBySemester = new Map<string, ManualCourse[]>();
    for (const manual of manualResults) {
      if (!entriesBySemester.has(manual.levelTerm)) {
        entriesBySemester.set(manual.levelTerm, []);
      }
      entriesBySemester.get(manual.levelTerm)!.push(manual);
    }
    return entriesBySemester;
  };

  const manualEntriesBySemester = getManualEntriesBySemester();

  const getSemestersWithPending = () => {
    const semestersWithPending = new Set<string>();
    for (const semester of CATALOG) {
      const semesterOverride = semesterGPAOverrides.get(semester.levelTerm);
      if (semesterOverride !== undefined) continue;
      
      let hasPending = false;
      for (const course of semester.courses) {
        let isFound = false;
        for (const code of course.codes) {
          if (fetchedCourseKeys.has(`${normalizeCode(code)}|${semester.levelTerm}`)) {
            isFound = true;
            break;
          }
        }
        for (const manual of manualResults) {
          for (const code of course.codes) {
            if (normalizeCode(manual.code) === normalizeCode(code) && manual.levelTerm === semester.levelTerm) {
              isFound = true;
              break;
            }
          }
        }
        if (!isFound) {
          hasPending = true;
          break;
        }
      }
      if (hasPending) {
        semestersWithPending.add(semester.levelTerm);
      }
    }
    return semestersWithPending;
  };

  const semestersWithPending = getSemestersWithPending();

  const navItems = [
    { id: "semesters", label: "📚 Semesters" },
    { id: "overview", label: "📊 Overview" },
    { id: "improvement", label: "🎯 Self Improvement" },
    { id: "manual", label: "✏️ Manual Entry" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-teal-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg sm:text-xl truncate text-gray-900">
                  {data.name || "Student Dashboard"}
                </h1>
                <p className="text-xs text-gray-500 truncate">
                  ID: {data.studentId} • {agg.semesters.filter(s => s.credits > 0).length} Semesters • {manualCoursesCount} Manual Edits
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="shrink-0 border-teal-200 hover:bg-teal-50 text-teal-600 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 sm:p-5 text-white shadow-lg">
            <p className="text-xs sm:text-sm text-white/80">CGPA</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{agg.cgpa.toFixed(3)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-teal-100">
            <p className="text-xs sm:text-sm text-gray-500">Completed Credits</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">{projections.earnedCredits}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-teal-100">
            <p className="text-xs sm:text-sm text-gray-500">Total Credits</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">{projections.totalCredits}</p>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-teal-100">
            <p className="text-xs sm:text-sm text-gray-500">Courses Completed</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">{totalCourses}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-teal-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "semesters" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {agg.semesters.map((semester) => {
              const isOpen = openSemesters.has(semester.levelTerm);
              const catalogSemester = CATALOG.find(s => s.levelTerm === semester.levelTerm);
              const isOverridden = semester.isOverridden;

              return (
                <Card key={semester.levelTerm} className={`border-0 shadow-lg overflow-hidden transition-all ${isOpen ? "sm:col-span-2 lg:col-span-2" : ""}`}>
                  <div
                    className={`h-1.5 ${
                      isOverridden
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : semester.credits > 0
                          ? "bg-gradient-to-r from-teal-400 to-emerald-500"
                          : "bg-gray-300"
                    }`}
                  />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">{semester.levelTerm}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <p className="text-xs text-gray-400">GPA</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xl sm:text-2xl font-bold ${isOverridden ? "text-amber-600" : "text-teal-600"}`}>
                            {semester.credits > 0 ? semester.gpa.toFixed(3) : "—"}
                          </p>
                          {isOverridden && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                              Manual GPA
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Credits Earned</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-700">
                          {semester.credits}/{semester.totalCredit}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSemester(semester.levelTerm)}
                      className="w-full border-teal-200 hover:bg-teal-50 text-teal-600"
                    >
                      {isOpen ? (
                        <>Hide Details <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Show Details <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>

                    {isOpen && !isOverridden && catalogSemester && (
                      <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
                        {catalogSemester.courses.map((course, idx) => {
                          const matchedCourse = resultMap.get(`${normalizeCode(course.codes[0])}|${semester.levelTerm}`);
                          const isManuallyEdited = hasManualOverride(course.codes[0], semester.levelTerm);
                          const isElective = course.name.toLowerCase().includes("elective");
                          const displayCode = matchedCourse ? matchedCourse.code : isElective ? "Elective" : course.codes[0];

                          return (
                            <div
                              key={idx}
                              className={`p-2 sm:p-3 rounded-lg transition-all ${
                                matchedCourse
                                  ? isManuallyEdited
                                    ? "bg-amber-50 border-l-4 border-amber-400"
                                    : "bg-teal-50"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm truncate">{displayCode}</p>
                                    {isManuallyEdited && (
                                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                        <UserPlus className="w-3 h-3 mr-1" /> Manual
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{course.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">Credit: {course.credit || 3}</p>
                                </div>
                                {matchedCourse ? (
                                  <Badge
                                    className={`shrink-0 ${
                                      matchedCourse.grade === "F"
                                        ? "bg-red-500"
                                        : isManuallyEdited
                                        ? "bg-amber-500"
                                        : "bg-gradient-to-r from-teal-500 to-emerald-500"
                                    }`}
                                  >
                                    {matchedCourse.grade}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="shrink-0 text-gray-400">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {isOpen && isOverridden && (
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <p className="text-sm text-amber-700">
                          Semester GPA manually set to {semester.overrideGPA?.toFixed(3)}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Individual course grades are not shown when manual GPA is applied.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Overview Tab - Grade Summary Cards Only (No Chart) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-emerald-500" />
                  Grade Distribution Summary
                </CardTitle>
                <p className="text-sm text-gray-500">Overview of all grades across Theory and Sessional/Lab courses</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {chartData.map((d) => (
                    <div
                      key={d.grade}
                      className="text-center p-3 rounded-lg transition-all hover:scale-105"
                      style={{ backgroundColor: `${d.color}15`, borderLeft: `4px solid ${d.color}` }}
                    >
                      <p className="text-xl font-bold" style={{ color: d.color }}>
                        {d.grade}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{d.total} courses</p>
                      <div className="flex justify-center gap-2 text-xs mt-1 flex-wrap">
                        {d.Theory > 0 && <span className="text-teal-600">📘 {d.Theory}</span>}
                        {d.Sessional > 0 && <span className="text-amber-600">🔬 {d.Sessional}</span>}
                      </div>
                      {d.Manual > 0 && <p className="text-xs text-amber-500 mt-1">✏️ {d.Manual} edited</p>}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Theory Courses:</span>
                    <span className="font-semibold text-teal-600">{chartData.reduce((a, d) => a + d.Theory, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Sessional Courses:</span>
                    <span className="font-semibold text-amber-600">{chartData.reduce((a, d) => a + d.Sessional, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Manually Edited:</span>
                    <span className="font-semibold text-amber-600">{manualCoursesCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "improvement" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-teal-600" />
                  Maximum Potential CGPA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm text-gray-600 mb-2">You can achieve up to</p>
                  <p className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    {projections.maxCGPA.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    by getting <span className="font-semibold text-green-600">4.00 (A+)</span> in all remaining {projections.remainingCredits} credits
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between text-sm gap-2">
                    <span className="text-gray-600">Current CGPA:</span>
                    <span className="font-semibold text-gray-900">{projections.currentCGPA.toFixed(3)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between text-sm gap-2">
                    <span className="text-gray-600">Completed Credits:</span>
                    <span className="font-semibold text-gray-900">{projections.earnedCredits}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between text-sm gap-2">
                    <span className="text-gray-600">Remaining Credits:</span>
                    <span className="font-semibold text-gray-900">{projections.remainingCredits}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between text-sm gap-2 pt-2 border-t">
                    <span className="text-gray-600">Total Program Credits:</span>
                    <span className="font-semibold text-gray-900">{projections.totalCredits}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Target GPA Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-gray-700 text-sm">Desired Target CGPA</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="0.01"
                      value={targetGPA}
                      onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none bg-gradient-to-r from-teal-200 to-emerald-200"
                    />
                    <Input
                      type="number"
                      value={targetGPA}
                      onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                      step="0.01"
                      min="0"
                      max="4"
                      className="w-full sm:w-24 text-center font-semibold"
                    />
                  </div>
                </div>

                <div
                  className={`rounded-lg p-4 sm:p-5 ${
                    projections.isAchievable
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                      : "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <span className="text-sm font-medium">Required GPA in remaining semesters:</span>
                    <span className={`text-2xl sm:text-3xl font-bold ${projections.isAchievable ? "text-green-600" : "text-red-600"}`}>
                      {projections.neededGPA > 0 ? projections.neededGPA.toFixed(3) : "0.000"}
                    </span>
                  </div>

                  {projections.isAchievable ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Achievable! You need {projections.neededGPA.toFixed(3)} GPA in remaining courses.</span>
                    </div>
                  ) : projections.remainingCredits === 0 ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>You have completed all courses.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Not achievable. Maximum possible: {projections.maxCGPA.toFixed(3)}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-2">📘 Grade Point Scale:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                    <div className="grid grid-cols-2 gap-1">
                      <span>A+ = 4.00</span>
                      <span>A = 3.75</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>A- = 3.50</span>
                      <span>B+ = 3.25</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>B = 3.00</span>
                      <span>B- = 2.75</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>C+ = 2.50</span>
                      <span>C = 2.25</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>D = 2.00</span>
                      <span>F = 0.00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6">
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <strong>ℹ️ Note:</strong> Manual GPA overrides will replace all course grades for that semester. The data will only be stored in your browser cache and not in any database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CATALOG.map((semester) => {
                const manualGPA = semesterGPAOverrides.get(semester.levelTerm);
                const tempValue = tempGPAs.get(semester.levelTerm) || (manualGPA !== undefined ? manualGPA.toFixed(3) : "");
                const semData = semesterMap.get(semester.levelTerm);
                
                return (
                  <Card key={`override-${semester.levelTerm}`} className="border-0 shadow-lg overflow-hidden">
                    <div className={`px-4 py-3 ${manualGPA !== undefined ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-teal-500 to-emerald-500"}`}>
                      <h3 className="font-semibold text-white">{semester.levelTerm}</h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500">Current GPA (from system)</p>
                            <p className="text-xl font-bold text-teal-600">
                              {semData && semData.credits > 0 ? semData.gpa.toFixed(3) : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total Credits</p>
                            <p className="text-lg font-semibold text-gray-700">{semester.totalCredit}</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <Label className="text-sm font-medium text-gray-700">Manual GPA Override</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              max="4"
                              placeholder="Enter GPA (0-4)"
                              value={tempValue}
                              onChange={(e) => handleTempGPAChange(semester.levelTerm, e.target.value)}
                              className="flex-1 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveSemesterGPA(semester.levelTerm)}
                              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                              disabled={!tempValue || tempValue === ""}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            {manualGPA !== undefined && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClearSemesterGPA(semester.levelTerm)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Eraser className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {manualGPA !== undefined && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Override active: {manualGPA.toFixed(3)} GPA for all {semester.totalCredit} credits
                            </p>
                          )}
                          {manualGPA === undefined && tempValue && (
                            <p className="text-xs text-gray-400 mt-2">
                              Enter a GPA and click Save to override this semester
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Individual Course Manual Entries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {manualEntriesBySemester.size > 0 ? (
                  Array.from(manualEntriesBySemester.entries()).map(([levelTerm, entries]) => {
                    const hasOverride = semesterGPAOverrides.has(levelTerm);
                    if (hasOverride) return null;
                    
                    const isOpen = openManualSemesters.has(`${levelTerm}_individual`);
                    
                    return (
                      <Card key={`individual-${levelTerm}`} className="border-0 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-white">{levelTerm}</h3>
                            <Badge className="bg-white/20 text-white border-0">
                              <UserPlus className="w-3 h-3 mr-1" /> {entries.length} entries
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <button
                            onClick={() => toggleManualSemester(`${levelTerm}_individual`)}
                            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 py-2 mb-2"
                          >
                            <span>Your Manual Grade Entries</span>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {isOpen && (
                            <div className="mt-3 space-y-3">
                              {entries.map((entry) => (
                                <div key={entry.id} className="p-3 rounded-lg border bg-amber-50 border-amber-300">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="font-mono bg-white text-xs">
                                          {entry.code}
                                        </Badge>
                                        <span className="font-medium text-gray-800 text-sm">{entry.name}</span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {entry.credit} credit(s) • {entry.sessional ? "Sessional/Lab" : "Theory"}
                                      </p>
                                      <p className="text-xs text-amber-600 mt-1">
                                        Grade: <span className="font-semibold">{entry.grade}</span>
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingCourse(entry);
                                          setFormData({
                                            code: entry.code,
                                            name: entry.name,
                                            grade: entry.grade,
                                            credit: entry.credit,
                                            sessional: entry.sessional,
                                            levelTerm: entry.levelTerm,
                                          });
                                        }}
                                        className="border-amber-300 text-amber-600"
                                      >
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteManualCourse(entry.id)}
                                        className="border-red-300 text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border-0 shadow-lg col-span-2">
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">No individual course manual entries yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Add grades for pending courses above.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {semestersWithPending.size > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-500" />
                  Pending Courses (No Official Results Yet)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from(semestersWithPending).map((levelTerm) => {
                    const hasOverride = semesterGPAOverrides.has(levelTerm);
                    if (hasOverride) return null;
                    
                    const pendingCourses = getPendingCoursesForSemester(levelTerm);
                    if (pendingCourses.length === 0) return null;
                    
                    const isOpen = openManualSemesters.has(`${levelTerm}_pending`);
                    
                    return (
                      <Card key={`pending-${levelTerm}`} className="border-0 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3">
                          <h3 className="font-semibold text-white">{levelTerm}</h3>
                        </div>
                        <CardContent className="p-4">
                          <button
                            onClick={() => toggleManualSemester(`${levelTerm}_pending`)}
                            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 py-2 mb-2"
                          >
                            <span>Add Grades for Pending Courses ({pendingCourses.length})</span>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {isOpen && (
                            <div className="mt-3 space-y-3">
                              {pendingCourses.map((pending, idx) => {
                                const isManuallyAdded = manualResults.some(
                                  m => {
                                    for (const code of pending.possibleCodes) {
                                      if (normalizeCode(m.code) === normalizeCode(code) && m.levelTerm === levelTerm) {
                                        return true;
                                      }
                                    }
                                    return false;
                                  }
                                );

                                return (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-lg border bg-gray-50 border-gray-200"
                                  >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant="outline" className="font-mono bg-white text-xs">
                                            {pending.code}
                                          </Badge>
                                          <span className="font-medium text-gray-800 text-sm">{pending.name}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {pending.credit} credit(s) • {pending.sessional ? "Sessional/Lab" : "Theory"}
                                        </p>
                                      </div>
                                      {!isManuallyAdded && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setFormData({
                                              code: pending.possibleCodes[0],
                                              name: pending.name,
                                              grade: "A+",
                                              credit: pending.credit,
                                              sessional: pending.sessional,
                                              levelTerm: pending.levelTerm,
                                            });
                                            setShowAddModal(true);
                                          }}
                                          className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm"
                                        >
                                          <Plus className="w-4 h-4 mr-1" /> Add Grade
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {(showAddModal || editingCourse) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {editingCourse ? "Edit Course Grade" : "Add Course Grade"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCourse(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 text-sm">Course Code</Label>
                <Input value={formData.code} disabled className="mt-1 bg-gray-50" />
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Course Name</Label>
                <Input value={formData.name} disabled className="mt-1 bg-gray-50" />
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Semester</Label>
                <Input value={formData.levelTerm} disabled className="mt-1 bg-gray-50" />
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Grade *</Label>
                <select
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {g} ({getGradePoint(g).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-gray-700 text-sm">Credit Hours</Label>
                <Input type="number" value={formData.credit} disabled className="mt-1 bg-gray-50" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sessional"
                  checked={formData.sessional}
                  disabled
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="sessional" className="text-gray-500 text-sm cursor-not-allowed">
                  {formData.sessional ? "Sessional/Lab Course" : "Theory Course"}
                </Label>
              </div>

              <div className="text-xs text-teal-600 bg-teal-50 p-2 rounded">
                💡 This grade will be used for CGPA calculation until the official result is published.
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCourse(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingCourse ? updateManualCourse : addManualCourse}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCourse ? "Update Grade" : "Save Grade"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
