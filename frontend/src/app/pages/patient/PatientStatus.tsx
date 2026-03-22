import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  getPatient,
  getDepartments,
  getStaff,
  type PatientRecord,
} from "../../../lib/api";

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

export default function PatientStatus() {
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get("id") || "");
  const [searchedId, setSearchedId] = useState(searchParams.get("id") || "");
  const [isNewPatient] = useState(searchParams.get("new") === "true");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [deptName, setDeptName] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPatient = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setPatient(null);
    setDeptName(null);
    setDoctorName(null);
    try {
      const p = await getPatient(id);
      setPatient(p);

      // Resolve department and doctor names in parallel
      const [depts, staff] = await Promise.all([getDepartments(), getStaff()]);
      if (p.department_id) {
        const dept = depts.find(
          (d: { id: string; name: string }) => d.id === p.department_id,
        );
        setDeptName(dept?.name ?? p.department_id);
      }
      if (p.assigned_doctor_id) {
        const doc = staff.find(
          (s: { id: string; name: string }) => s.id === p.assigned_doctor_id,
        );
        setDoctorName(doc?.name ?? p.assigned_doctor_id);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchedId(patientId);
    fetchPatient(patientId);
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    fetchPatient(searchedId);
  };

  useEffect(() => {
    if (searchedId) fetchPatient(searchedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      if (searchedId) fetchPatient(searchedId);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedId]);

  const getWaitTime = (createdAt: string) => {
    const arrival = new Date(createdAt + "Z");
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link to="/patient">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4 mr-2" />
                Back to Patient Portal
              </Button>
            </Link>
          </div>

          {/* Success Message for New Patients */}
          {isNewPatient && patient && (
            <Card className="mb-6 border-green-300 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Check-In Successful!
                    </h3>
                    <p className="text-sm text-green-800 mb-2">
                      You have been successfully registered and added to the
                      queue.
                    </p>
                    <p className="text-sm font-medium text-green-900">
                      Your Patient ID:{" "}
                      <span className="font-mono">{patient.id}</span>
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Please save this ID to check your status later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Check Your Queue Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patientId">Enter Your Patient ID</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="patientId"
                    placeholder="e.g., 5943f973-c0f0-4177-a780-afc8b72893d1"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4 mr-2" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Your Patient ID was provided when you checked in.
              </p>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Patient Status Display */}
          {!loading && patient && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Queue Status for {patient.name}</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="size-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Current Status
                    </span>
                    <Badge
                      variant={
                        patient.status === "in_progress"
                          ? "default"
                          : patient.status === "discharged"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {STATUS_LABELS[patient.status] ?? patient.status}
                    </Badge>
                  </div>

                  {/* CTAS Level */}
                  {patient.ctas_level && (
                    <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Triage Priority
                      </span>
                      <Badge
                        variant={
                          patient.ctas_level <= 2
                            ? "destructive"
                            : patient.ctas_level === 3
                              ? "default"
                              : "secondary"
                        }
                      >
                        CTAS {patient.ctas_level} —{" "}
                        {CTAS_LABELS[patient.ctas_level]}
                      </Badge>
                    </div>
                  )}

                  {/* Wait time */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="size-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Time Waiting
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {getWaitTime(patient.created_at)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Since {new Date(patient.created_at + "Z").toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Assignment */}
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    {deptName && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Assigned Department:
                        </span>
                        <p className="text-slate-900">{deptName}</p>
                      </div>
                    )}
                    {doctorName && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          Assigned Doctor:
                        </span>
                        <p className="text-slate-900">{doctorName}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Summary */}
                  {patient.ai_summary && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Clinical Summary
                      </p>
                      <p className="text-sm text-blue-800">
                        {patient.ai_summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm text-amber-900">
                      <p className="font-semibold">Important Information:</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-800">
                        <li>
                          Please remain in the waiting area so we can call you
                          when ready
                        </li>
                        <li>
                          If your condition worsens, inform the reception
                          immediately
                        </li>
                        <li>
                          Wait times are estimates and may vary based on
                          emergency cases
                        </li>
                        <li>
                          Critical patients are prioritized and seen first
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Not Found */}
          {!loading && notFound && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="py-12 text-center">
                <AlertCircle className="size-12 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-red-900 mb-1">
                  Patient ID Not Found
                </h3>
                <p className="text-red-800 mb-4">
                  We couldn't find a patient with ID:{" "}
                  <span className="font-mono">{searchedId}</span>
                </p>
                <p className="text-sm text-red-700">
                  Please check your Patient ID and try again, or contact the
                  reception desk for assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
