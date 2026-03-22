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
import { getPatients, getDepartments, type PatientRecord, type Department } from "../../lib/api";
import { Search, Filter, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router";

function ctasToSeverity(ctas: number | null): string {
  switch (ctas) {
    case 1: return "Resuscitation";
    case 2: return "Critical";
    case 3: return "Urgent";
    case 4: return "Semi-Urgent";
    case 5: return "Non-Urgent";
    default: return "Unknown";
  }
}

function getSeverityColor(ctas: number | null): "destructive" | "default" | "secondary" | "outline" {
  switch (ctas) {
    case 1:
    case 2: return "destructive";
    case 3: return "default";
    case 4: return "secondary";
    default: return "outline";
  }
}

function getWaitTime(createdAt: string) {
  const arrival = new Date(createdAt + "Z");
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PatientQueue() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  function loadData() {
    Promise.all([getPatients(), getDepartments()])
      .then(([p, d]) => {
        setPatients(p);
        setDepartments(d);
      })
      .finally(() => setLoading(false));
  }

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.health_number || "").toLowerCase().includes(searchQuery.toLowerCase());

    const severity = ctasToSeverity(p.ctas_level);
    const matchesSeverity = severityFilter === "all" || severity === severityFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Already sorted by CTAS from backend, but let's ensure
  const sortedPatients = [...filteredPatients].sort(
    (a, b) => (a.ctas_level || 5) - (b.ctas_level || 5)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patient Queue</h1>
          <p className="text-slate-600 mt-1">
            {sortedPatients.length} patient{sortedPatients.length !== 1 ? "s" : ""} in queue
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Resuscitation">Resuscitation (CTAS 1)</SelectItem>
                <SelectItem value="Critical">Critical (CTAS 2)</SelectItem>
                <SelectItem value="Urgent">Urgent (CTAS 3)</SelectItem>
                <SelectItem value="Semi-Urgent">Semi-Urgent (CTAS 4)</SelectItem>
                <SelectItem value="Non-Urgent">Non-Urgent (CTAS 5)</SelectItem>
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
        </CardContent>
      </Card>

      {/* Patient Queue List */}
      <div className="space-y-3">
        {sortedPatients.map((patient, index) => {
          const severity = ctasToSeverity(patient.ctas_level);
          const structured = patient.structured_symptoms as Record<string, unknown> | null;
          const chiefComplaint =
            (structured?.chief_complaint as string) || patient.raw_symptoms;
          const symptoms = (structured?.symptoms as string[]) || [];

          return (
            <Card
              key={patient.id}
              className={
                (patient.ctas_level || 5) <= 2
                  ? "border-red-300 bg-red-50"
                  : patient.ctas_level === 3
                  ? "border-orange-300 bg-orange-50"
                  : ""
              }
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Queue Number */}
                  <div className="flex-shrink-0">
                    <div className="size-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-slate-700">{index + 1}</span>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {patient.name}
                        </h3>
                        <Badge variant={getSeverityColor(patient.ctas_level)}>
                          CTAS {patient.ctas_level} — {severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {patient.status}
                        </Badge>
                      </div>
                      <Link to={`/patient/${patient.id}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">Health Number:</span>
                          <span className="text-slate-600">{patient.health_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">Demographics:</span>
                          <span className="text-slate-600">
                            {patient.age} years, {patient.gender}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {patient.department_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-700">Department:</span>
                            <span className="text-slate-600">
                              {deptMap[patient.department_id] || patient.department_id}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="size-4 text-slate-500" />
                          <span className="font-medium text-slate-700">Wait Time:</span>
                          <span className="text-slate-600">
                            {getWaitTime(patient.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            {chiefComplaint}
                          </p>
                          {symptoms.length > 0 && (
                            <p className="text-sm text-slate-600">
                              Symptoms: {symptoms.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {patient.ai_summary && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                            AI
                          </div>
                          <p className="text-sm text-slate-700 flex-1">
                            {patient.ai_summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedPatients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Filter className="size-12 text-slate-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">No patients found</h3>
              <p className="text-slate-600">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
