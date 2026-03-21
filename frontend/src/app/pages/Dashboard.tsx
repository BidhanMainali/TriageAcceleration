import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api, QueuePatient } from "../lib/api";
import { Users, Clock, AlertTriangle, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {
  const [patients, setPatients] = useState<QueuePatient[]>([]);

  useEffect(() => {
    api.getQueue().then(setPatients).catch(console.error);
  }, []);

  const criticalPatients = patients.filter(p => p.triage_severity === 'Critical');
  const waitingPatients = patients.filter(p => p.status === 'Waiting');
  const myPatients = patients.filter(p => p.assigned_doctor === 'Dr. Sarah Chen');

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
            <CardTitle className="text-sm font-medium text-slate-600">My Patients</CardTitle>
            <Activity className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPatients.length}</div>
            <p className="text-xs text-slate-600 mt-1">Assigned to you</p>
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
              <div
                key={patient.patient_id}
                className="bg-white p-4 rounded-lg border border-red-200"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{patient.full_name}</h3>
                      <Badge variant="destructive">Critical</Badge>
                      <span className="text-sm text-slate-600">#{patient.patient_id}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{patient.chief_complaint}</p>
                    <p className="text-sm text-slate-600">
                      Assigned: {patient.assigned_department} - {patient.assigned_doctor}
                    </p>
                  </div>
                  <Link to={`/patient/${patient.patient_id}`}>
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
                key={patient.patient_id}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{patient.full_name}</h3>
                      <Badge
                        variant={
                          patient.triage_severity === 'Critical'
                            ? 'destructive'
                            : patient.triage_severity === 'Urgent'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {patient.triage_severity}
                      </Badge>
                      <Badge variant="outline">{patient.status}</Badge>
                      <span className="text-sm text-slate-600">
                        Age: {patient.age} | {patient.gender}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">
                      <span className="font-medium">Chief Complaint:</span> {patient.chief_complaint}
                    </p>
                    <p className="text-sm text-slate-600">
                      {patient.arrival_time && (
                        <><span className="font-medium">Arrival:</span>{" "}
                        {new Date(patient.arrival_time).toLocaleTimeString()} | </>
                      )}
                      <span className="font-medium">Patient ID:</span> {patient.patient_id}
                    </p>
                  </div>
                  <Link to={`/patient/${patient.patient_id}`}>
                    <Button variant="outline">
                      View Details
                    </Button>
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

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Emergency', 'Cardiology', 'Respiratory', 'Orthopedics'] as const).map((dept) => {
              const count = patients.filter(p => p.assigned_department === dept).length;
              return (
                <div key={dept} className="p-4 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-1">{dept}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-slate-600">Patients</span>
                    <Badge variant="secondary">{count}</Badge>
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
