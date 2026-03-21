import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  User,
  AlertCircle,
  Clock,
  Stethoscope,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  getPatient,
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

export default function PatientDetails() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [deptName, setDeptName] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const p = await getPatient(patientId);
        setPatient(p);
        const [depts, staff] = await Promise.all([
          getDepartments(),
          getStaff(),
        ]);
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
    })();
  }, [patientId]);

  const getWaitTime = (createdAt: string) => {
    const arrival = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="size-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">
              Patient not found
            </h3>
            <p className="text-slate-600 mb-4">
              The patient with ID {patientId} could not be found.
            </p>
            <Link to="/queue">
              <Button>
                <ArrowLeft className="size-4 mr-2" />
                Back to Queue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const structured = patient.structured_symptoms as Record<
    string,
    unknown
  > | null;
  const chiefComplaint = structured?.chief_complaint as string | undefined;
  const symptoms = structured?.symptoms as string[] | undefined;
  const relevantHistory = structured?.relevant_history as string | undefined;
  const severityIndicators = structured?.severity_indicators as
    | string[]
    | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/queue">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Queue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                {patient.name}
              </h1>
              {patient.ctas_level && (
                <Badge variant={ctasBadgeVariant(patient.ctas_level)}>
                  CTAS {patient.ctas_level} — {CTAS_LABELS[patient.ctas_level]}
                </Badge>
              )}
              <Badge variant="outline">
                {STATUS_LABELS[patient.status] ?? patient.status}
              </Badge>
            </div>
            <p className="text-slate-600 text-sm font-mono">ID: {patient.id}</p>
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {patient.ctas_level === 1 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Critical Patient — Immediate Attention Required
              </h3>
              {chiefComplaint && (
                <p className="text-sm text-red-800">{chiefComplaint}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {patient.ai_summary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                AI SUMMARY
              </div>
              Clinical Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{patient.ai_summary}</p>
            {deptName && (
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-blue-200">
                <Stethoscope className="size-4 text-blue-700" />
                <span className="text-sm font-medium text-slate-700">
                  Recommended Department:
                </span>
                <Badge>{deptName}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.health_number && (
                <div>
                  <p className="text-sm text-slate-600">Health Number</p>
                  <p className="font-medium text-slate-900">
                    {patient.health_number}
                  </p>
                </div>
              )}
              {patient.age && (
                <div>
                  <p className="text-sm text-slate-600">Age</p>
                  <p className="font-medium text-slate-900">
                    {patient.age} years
                  </p>
                </div>
              )}
              {patient.gender && (
                <div>
                  <p className="text-sm text-slate-600">Gender</p>
                  <p className="font-medium text-slate-900">{patient.gender}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Arrival Time</p>
                <p className="font-medium text-slate-900">
                  {new Date(patient.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Wait Time</p>
                <p className="font-medium text-slate-900">
                  {getWaitTime(patient.created_at)}
                </p>
              </div>
              {deptName && (
                <div>
                  <p className="text-sm text-slate-600">Assigned Department</p>
                  <p className="font-medium text-slate-900">{deptName}</p>
                </div>
              )}
              {doctorName && (
                <div>
                  <p className="text-sm text-slate-600">Assigned Doctor</p>
                  <p className="font-medium text-slate-900">{doctorName}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Visit */}
          <Card>
            <CardHeader>
              <CardTitle>Current Visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chiefComplaint && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Chief Complaint</p>
                  <p className="font-medium text-slate-900">{chiefComplaint}</p>
                </div>
              )}
              {symptoms && symptoms.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    Reported Symptoms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((s, i) => (
                      <Badge key={i} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {severityIndicators && severityIndicators.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    Severity Indicators
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {severityIndicators.map((s, i) => (
                      <Badge key={i} variant="destructive">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!chiefComplaint && patient.raw_symptoms && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Raw Symptoms</p>
                  <p className="text-slate-900">{patient.raw_symptoms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical History */}
          {relevantHistory && (
            <Card>
              <CardHeader>
                <CardTitle>Relevant Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{relevantHistory}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
