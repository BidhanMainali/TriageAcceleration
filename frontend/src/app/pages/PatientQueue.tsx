import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
import { api, QueuePatient } from "../lib/api";
import { Search, Filter, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router";

export default function PatientQueue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQueue()
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.health_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || patient.triage_severity === severityFilter;

    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Queue is already sorted by backend; keep order
  const sortedPatients = filteredPatients;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'destructive';
      case 'Urgent': return 'default';
      case 'Semi-Urgent': return 'secondary';
      default: return 'outline';
    }
  };

  const getWaitTime = (arrivalTime: string | null) => {
    if (!arrivalTime) return "—";
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patient Queue</h1>
          <p className="text-slate-600 mt-1">
            {loading ? "Loading..." : `${sortedPatients.length} patient${sortedPatients.length !== 1 ? 's' : ''} in queue`}
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
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Semi-Urgent">Semi-Urgent</SelectItem>
                <SelectItem value="Non-Urgent">Non-Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Queue List */}
      <div className="space-y-3">
        {sortedPatients.map((patient, index) => (
          <Card
            key={patient.patient_id}
            className={
              patient.triage_severity === 'Critical'
                ? 'border-red-300 bg-red-50'
                : patient.triage_severity === 'Urgent'
                ? 'border-orange-300 bg-orange-50'
                : ''
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
                        {patient.full_name}
                      </h3>
                      <Badge variant={getSeverityColor(patient.triage_severity)}>
                        {patient.triage_severity}
                      </Badge>
                      <Badge variant="outline">{patient.status}</Badge>
                    </div>
                    <Link to={`/patient/${patient.patient_id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Patient ID:</span>
                        <span className="text-slate-600">{patient.patient_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Health Number:</span>
                        <span className="text-slate-600">{patient.health_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Demographics:</span>
                        <span className="text-slate-600">
                          {patient.age} years, {patient.gender}{patient.blood_type ? `, ${patient.blood_type}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Department:</span>
                        <span className="text-slate-600">{patient.assigned_department ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">Assigned Doctor:</span>
                        <span className="text-slate-600">{patient.assigned_doctor ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-slate-500" />
                        <span className="font-medium text-slate-700">Wait Time:</span>
                        <span className="text-slate-600">{getWaitTime(patient.arrival_time)}</span>
                        {patient.arrival_time && (
                          <span className="text-slate-500">
                            (Arrived: {new Date(patient.arrival_time).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Chief Complaint: {patient.chief_complaint}
                        </p>
                        <p className="text-sm text-slate-600">
                          Symptoms: {patient.symptoms.join(', ')}
                        </p>
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
                        <p className="text-sm text-slate-700 flex-1">{patient.ai_summary}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Recommended Specialist:
                        </span>
                        <Badge>{patient.recommended_specialist}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

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
