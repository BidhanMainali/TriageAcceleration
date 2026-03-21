import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { mockPatients } from "../../data/mockData";

export default function PatientStatus() {
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get("id") || "");
  const [searchedId, setSearchedId] = useState(searchParams.get("id") || "");
  const [isNewPatient] = useState(searchParams.get("new") === "true");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const patient = mockPatients.find((p) => p.patientId === searchedId);

  const handleSearch = () => {
    setSearchedId(patientId);
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getQueuePosition = (patientId: string) => {
    const sortedPatients = [...mockPatients].sort((a, b) => {
      const severityOrder = { Critical: 0, Urgent: 1, 'Semi-Urgent': 2, 'Non-Urgent': 3 };
      if (severityOrder[a.triageSeverity] !== severityOrder[b.triageSeverity]) {
        return severityOrder[a.triageSeverity] - severityOrder[b.triageSeverity];
      }
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    });

    return sortedPatients.findIndex((p) => p.patientId === patientId) + 1;
  };

  const getEstimatedWaitTime = (position: number, severity: string) => {
    const baseTime = {
      'Critical': 5,
      'Urgent': 15,
      'Semi-Urgent': 45,
      'Non-Urgent': 90,
    }[severity] || 60;

    return baseTime * position;
  };

  const getWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
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
                    <h3 className="font-semibold text-green-900 mb-1">Check-In Successful!</h3>
                    <p className="text-sm text-green-800 mb-2">
                      You have been successfully registered and added to the queue.
                    </p>
                    <p className="text-sm font-medium text-green-900">
                      Your Patient ID: <span className="font-mono">{patient.patientId}</span>
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
                    placeholder="e.g., P20260321001"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="size-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Your Patient ID was provided when you checked in. It starts with 'P' followed by numbers.
              </p>
            </CardContent>
          </Card>

          {/* Patient Status Display */}
          {searchedId && patient && (
            <div className="space-y-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Queue Status for {patient.fullName}</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="size-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Status */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Current Status</span>
                      <Badge
                        variant={
                          patient.status === 'In Progress'
                            ? 'default'
                            : patient.status === 'Completed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {patient.status}
                      </Badge>
                    </div>
                    {patient.status === 'Waiting' && (
                      <p className="text-sm text-slate-600">
                        You are currently in the waiting queue. Please remain in the waiting area.
                      </p>
                    )}
                    {patient.status === 'In Progress' && (
                      <p className="text-sm text-slate-600">
                        You are currently being attended to by medical staff.
                      </p>
                    )}
                  </div>

                  {/* Triage Priority */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Triage Priority</span>
                      <Badge
                        variant={
                          patient.triageSeverity === 'Critical'
                            ? 'destructive'
                            : patient.triageSeverity === 'Urgent'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {patient.triageSeverity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {patient.triageSeverity === 'Critical' && 
                        'You will be seen immediately by our medical team.'}
                      {patient.triageSeverity === 'Urgent' && 
                        'You will be seen as soon as possible. This is a high priority case.'}
                      {patient.triageSeverity === 'Semi-Urgent' && 
                        'You will be seen in order of arrival within your priority level.'}
                    </p>
                  </div>

                  {/* Queue Position */}
                  {patient.status === 'Waiting' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="size-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-slate-900">Your Position in Queue</h4>
                          <p className="text-3xl font-bold text-blue-600 mt-1">
                            #{getQueuePosition(patient.patientId)}
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.max(0, 100 - (getQueuePosition(patient.patientId) * 10))} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Wait Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="size-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Time Waiting</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {getWaitTime(patient.arrivalTime)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Since {new Date(patient.arrivalTime).toLocaleTimeString()}
                      </p>
                    </div>

                    {patient.status === 'Waiting' && (
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="size-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Estimated Wait</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">
                          ~{getEstimatedWaitTime(getQueuePosition(patient.patientId), patient.triageSeverity)} min
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Approximate time remaining
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Assignment Info */}
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm font-medium text-slate-700">Assigned Department:</span>
                      <p className="text-slate-900">{patient.assignedDepartment}</p>
                    </div>
                    {patient.assignedDoctor && (
                      <div>
                        <span className="text-sm font-medium text-slate-700">Assigned Doctor:</span>
                        <p className="text-slate-900">{patient.assignedDoctor}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Important Information */}
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm text-amber-900">
                      <p className="font-semibold">Important Information:</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-800">
                        <li>Please remain in the waiting area so we can call you when ready</li>
                        <li>If your condition worsens, inform the reception immediately</li>
                        <li>Wait times are estimates and may vary based on emergency cases</li>
                        <li>Critical patients are prioritized and seen first</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Not Found Message */}
          {searchedId && !patient && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="py-12 text-center">
                <AlertCircle className="size-12 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-red-900 mb-1">Patient ID Not Found</h3>
                <p className="text-red-800 mb-4">
                  We couldn't find a patient with ID: <span className="font-mono">{searchedId}</span>
                </p>
                <p className="text-sm text-red-700">
                  Please check your Patient ID and try again, or contact the reception desk for assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
