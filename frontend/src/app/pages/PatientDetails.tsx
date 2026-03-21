import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import RoutingDecisionPanel from "../components/RoutingDecisionPanel";
import {
  getPatient,
  getRouting,
  getDepartments,
  type PatientRecord,
  type RoutingDecision,
  type Department,
} from "../../lib/api";
import {
  ArrowLeft,
  User,
  Clock,
  AlertCircle,
  AlertTriangle,
  Stethoscope,
  Loader2,
} from "lucide-react";

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

function ctasSeverityColor(ctas: number | null): "destructive" | "default" | "secondary" | "outline" {
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

export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [routing, setRouting] = useState<RoutingDecision | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    Promise.all([
      getPatient(patientId),
      getRouting(patientId).catch(() => null),
      getDepartments(),
    ])
      .then(([p, r, d]) => {
        setPatient(p);
        setRouting(r);
        setDepartments(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="size-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Patient not found</h3>
            <p className="text-slate-600 mb-4">
              {error || `The patient with ID ${patientId} could not be found.`}
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

  const structured = patient.structured_symptoms as Record<string, unknown> | null;
  const symptoms = (structured?.symptoms as string[]) || [];
  const chiefComplaint = (structured?.chief_complaint as string) || patient.raw_symptoms;
  const severityIndicators = (structured?.severity_indicators as string[]) || [];
  const vitalConcerns = (structured?.vital_concerns as string[]) || [];
  const relevantHistory = (structured?.relevant_history as string) || "None reported";
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

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
              <Badge variant={ctasSeverityColor(patient.ctas_level)}>
                CTAS {patient.ctas_level} — {ctasToSeverity(patient.ctas_level)}
              </Badge>
              <Badge variant="outline" className="capitalize">{patient.status}</Badge>
            </div>
            <p className="text-slate-600">
              {patient.health_number} &middot; {patient.age} years &middot;{" "}
              {patient.gender}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {patient.ctas_level && patient.ctas_level <= 2 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                {patient.ctas_level === 1 ? "RESUSCITATION" : "Critical Patient"} — Immediate Attention Required
              </h3>
              <p className="text-sm text-red-800">{chiefComplaint}</p>
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
          <CardContent className="space-y-3">
            <p className="text-slate-700">{patient.ai_summary}</p>
            <div className="flex items-center gap-4 pt-2 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <Stethoscope className="size-4 text-blue-700" />
                <span className="text-sm font-medium text-slate-700">
                  Recommended Department:
                </span>
                <Badge variant="default">
                  {deptMap[patient.department_id || ""] || patient.department_id}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Health Number</p>
                <p className="font-medium text-slate-900">{patient.health_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Age</p>
                <p className="font-medium text-slate-900">{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Gender</p>
                <p className="font-medium text-slate-900 capitalize">{patient.gender}</p>
              </div>
            </CardContent>
          </Card>

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
                  {new Date(patient.created_at + "Z").toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Wait Time</p>
                <p className="font-medium text-slate-900">
                  {getWaitTime(patient.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <Badge variant="outline" className="capitalize">{patient.status}</Badge>
              </div>
              {patient.department_id && (
                <div>
                  <p className="text-sm text-slate-600">Department</p>
                  <p className="font-medium text-slate-900">
                    {deptMap[patient.department_id] || patient.department_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Symptoms Card */}
          <Card>
            <CardHeader>
              <CardTitle>Chief Complaint & Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-900 font-medium">{chiefComplaint}</p>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}
              {severityIndicators.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Severity Indicators:</p>
                  <div className="flex flex-wrap gap-2">
                    {severityIndicators.map((s, i) => (
                      <Badge key={i} variant="destructive">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {vitalConcerns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Vital Concerns:</p>
                  <ul className="text-sm text-red-800 list-disc list-inside">
                    {vitalConcerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-600">Medical History:</p>
                <p className="text-sm text-slate-900">{relevantHistory}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Routing Decision */}
        <div className="lg:col-span-2">
          {routing ? (
            <RoutingDecisionPanel
              patientId={patient.id}
              routing={routing}
              departments={departments}
              onRouted={() => {
                // Refresh patient data
                getPatient(patient.id).then(setPatient);
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="size-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No routing decision available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
