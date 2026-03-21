import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, Clock, AlertTriangle, Activity, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { getPatients, getDepartments, getStaff, type PatientRecord } from "../../lib/api";

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

export default function Dashboard() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [patientsData, depts, staff] = await Promise.all([
          getPatients(),
          getDepartments(),
          getStaff(),
        ]);
        setPatients(patientsData);
        setDeptMap(Object.fromEntries(depts.map((d: { id: string; name: string }) => [d.id, d.name])));
        setStaffMap(Object.fromEntries(staff.map((s: { id: string; name: string }) => [s.id, s.name])));
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const criticalPatients = patients.filter(p => p.ctas_level === 1);
  const waitingPatients = patients.filter(p => p.status === "waiting");
  const inProgressPatients = patients.filter(p => p.status === "in_progress");
  // "My patients" = assigned to doc-chen (Dr. Sarah Chen) as a demo default
  const myPatients = patients.filter(p => p.assigned_doctor_id === "doc-chen");

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Patients</CardTitle>
            <Users className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-slate-600 mt-1">In emergency department</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Waiting</CardTitle>
            <Clock className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingPatients.length}</div>
            <p className="text-xs text-slate-600 mt-1">Awaiting consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Critical Cases</CardTitle>
            <AlertTriangle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalPatients.length}</div>
            <p className="text-xs text-slate-600 mt-1">Immediate attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            <Activity className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressPatients.length}</div>
            <p className="text-xs text-slate-600 mt-1">Currently being seen</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalPatients.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="size-5" />
              Critical Patients Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalPatients.map((patient) => (
              <div key={patient.id} className="bg-white p-4 rounded-lg border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <Badge variant="destructive">CTAS 1 — Resuscitation</Badge>
                    </div>
                    {patient.ai_summary && (
                      <p className="text-sm text-slate-700">{patient.ai_summary}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {patient.department_id && deptMap[patient.department_id] && (
                        <span>{deptMap[patient.department_id]}</span>
                      )}
                      {patient.assigned_doctor_id && staffMap[patient.assigned_doctor_id] && (
                        <span> — {staffMap[patient.assigned_doctor_id]}</span>
                      )}
                    </p>
                  </div>
                  <Link to={`/patient/${patient.id}`}>
                    <Button size="sm">
                      View Details
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Assigned Patients */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      {patient.ctas_level && (
                        <Badge variant={patient.ctas_level <= 2 ? "destructive" : patient.ctas_level === 3 ? "default" : "secondary"}>
                          CTAS {patient.ctas_level} — {CTAS_LABELS[patient.ctas_level]}
                        </Badge>
                      )}
                      <Badge variant="outline">{STATUS_LABELS[patient.status] ?? patient.status}</Badge>
                      {patient.age && (
                        <span className="text-sm text-slate-600">
                          Age: {patient.age}{patient.gender ? ` | ${patient.gender}` : ""}
                        </span>
                      )}
                    </div>
                    {patient.ai_summary && (
                      <p className="text-sm text-slate-700 mb-1">{patient.ai_summary}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Arrived:</span>{" "}
                      {new Date(patient.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Link to={`/patient/${patient.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
            {myPatients.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No patients currently assigned to you.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Staff Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Department Staff Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(deptMap).map(([id, name]) => {
              const deptPatients = patients.filter(p => p.department_id === id);
              return (
                <div key={id} className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-1">{name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-600">Patients</span>
                    <Badge variant="secondary">{deptPatients.length}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
