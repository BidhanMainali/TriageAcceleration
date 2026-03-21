import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import {
  getPatients,
  getDepartments,
  getStaff,
  type PatientRecord,
} from "../../lib/api";

const CTAS_LABELS: Record<number, string> = {
  1: "Resuscitation",
  2: "Emergent",
  3: "Urgent",
  4: "Less Urgent",
  5: "Non-Urgent",
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "Waiting",
  routed: "Routed",
  in_progress: "In Progress",
  discharged: "Discharged",
};

function ctasBadgeVariant(
  level: number | null,
): "destructive" | "default" | "secondary" | "outline" {
  if (!level) return "outline";
  if (level <= 2) return "destructive";
  if (level === 3) return "default";
  return "secondary";
}

function cardBorderClass(level: number | null): string {
  if (!level) return "";
  if (level === 1) return "border-red-300 bg-red-50";
  if (level === 2) return "border-orange-300 bg-orange-50";
  return "";
}

export default function PatientQueue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ctasFilter, setCtasFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const [patientsData, depts, staff] = await Promise.all([
        getPatients(),
        getDepartments(),
        getStaff(),
      ]);
      setPatients(patientsData);
      setDeptMap(
        Object.fromEntries(
          depts.map((d: { id: string; name: string }) => [d.id, d.name]),
        ),
      );
      setStaffMap(
        Object.fromEntries(
          staff.map((s: { id: string; name: string }) => [s.id, s.name]),
        ),
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getWaitTime = (createdAt: string) => {
    const arrival = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.health_number ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCtas =
      ctasFilter === "all" || String(p.ctas_level) === ctasFilter;

    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesCtas && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Patient Queue
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredPatients.length} patient
            {filteredPatients.length !== 1 ? "s" : ""} in queue
            {" · "}
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID, or health number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={ctasFilter} onValueChange={setCtasFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="1">CTAS 1 — Resuscitation</SelectItem>
            <SelectItem value="2">CTAS 2 — Emergent</SelectItem>
            <SelectItem value="3">CTAS 3 — Urgent</SelectItem>
            <SelectItem value="4">CTAS 4 — Less Urgent</SelectItem>
            <SelectItem value="5">CTAS 5 — Non-Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="routed">Routed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Queue List */}
      {!loading && (
        <div className="space-y-3">
          {filteredPatients.map((patient, index) => (
            <Card
              key={patient.id}
              className={cardBorderClass(patient.ctas_level)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Queue Number */}
                  <div className="flex-shrink-0">
                    <div className="size-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-slate-700">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {patient.name}
                        </h3>
                        {patient.ctas_level && (
                          <Badge variant={ctasBadgeVariant(patient.ctas_level)}>
                            CTAS {patient.ctas_level} —{" "}
                            {CTAS_LABELS[patient.ctas_level]}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {STATUS_LABELS[patient.status] ?? patient.status}
                        </Badge>
                      </div>
                      <Link to={`/patient/${patient.id}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Patient ID:
                          </span>
                          <span className="text-slate-600 font-mono text-xs">
                            {patient.id}
                          </span>
                        </div>
                        {patient.health_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-700">
                              Health Number:
                            </span>
                            <span className="text-slate-600">
                              {patient.health_number}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">
                            Demographics:
                          </span>
                          <span className="text-slate-600">
                            {patient.age} years
                            {patient.gender ? `, ${patient.gender}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {patient.department_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-700">
                              Department:
                            </span>
                            <span className="text-slate-600">
                              {deptMap[patient.department_id] ??
                                patient.department_id}
                            </span>
                          </div>
                        )}
                        {patient.assigned_doctor_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-700">
                              Assigned Doctor:
                            </span>
                            <span className="text-slate-600">
                              {staffMap[patient.assigned_doctor_id] ??
                                patient.assigned_doctor_id}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="size-4 text-slate-500" />
                          <span className="font-medium text-slate-700">
                            Wait Time:
                          </span>
                          <span className="text-slate-600">
                            {getWaitTime(patient.created_at)}
                          </span>
                          <span className="text-slate-500">
                            (Arrived:{" "}
                            {new Date(patient.created_at).toLocaleTimeString()})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Raw symptoms */}
                    {patient.raw_symptoms && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600">
                            {patient.raw_symptoms}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    {patient.ai_summary && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded flex-shrink-0">
                            AI
                          </div>
                          <p className="text-sm text-slate-700">
                            {patient.ai_summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPatients.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="size-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">
                  No patients found
                </h3>
                <p className="text-slate-600">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
