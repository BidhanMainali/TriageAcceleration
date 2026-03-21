import { useParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { mockPatients } from "../data/mockData";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  AlertCircle,
  FileText,
  Pill,
  AlertTriangle,
  Clock,
  Stethoscope,
} from "lucide-react";

export default function PatientDetails() {
  const { patientId } = useParams();
  const patient = mockPatients.find((p) => p.patientId === patientId);

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="size-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Patient not found</h3>
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'destructive';
      case 'Urgent':
        return 'default';
      case 'Semi-Urgent':
        return 'secondary';
      default:
        return 'outline';
    }
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
              <h1 className="text-2xl font-semibold text-slate-900">{patient.fullName}</h1>
              <Badge variant={getSeverityColor(patient.triageSeverity)}>
                {patient.triageSeverity}
              </Badge>
              <Badge variant="outline">{patient.status}</Badge>
            </div>
            <p className="text-slate-600">Patient ID: {patient.patientId}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {patient.triageSeverity === 'Critical' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Critical Patient - Immediate Attention Required</h3>
              <p className="text-sm text-red-800">{patient.chiefComplaint}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Card */}
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
          <p className="text-slate-700">{patient.aiSummary}</p>
          <div className="flex items-center gap-4 pt-2 border-t border-blue-200">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-blue-700" />
              <span className="text-sm font-medium text-slate-700">Recommended Specialist:</span>
              <Badge variant="default">{patient.recommendedSpecialist}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info & Vitals */}
        <div className="space-y-6">
          {/* Demographics */}
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
                <p className="font-medium text-slate-900">{patient.healthNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Date of Birth</p>
                <p className="font-medium text-slate-900">
                  {new Date(patient.dateOfBirth).toLocaleDateString()} ({patient.age} years)
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Gender</p>
                <p className="font-medium text-slate-900">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Blood Type</p>
                <p className="font-medium text-slate-900">{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Contact</p>
                <p className="font-medium text-slate-900">{patient.contactNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Emergency Contact</p>
                <p className="font-medium text-slate-900">{patient.emergencyContact}</p>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="size-5 text-red-500" />
                  <span className="text-sm text-slate-600">Blood Pressure</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {patient.vitalSigns.bloodPressure}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-pink-500" />
                  <span className="text-sm text-slate-600">Heart Rate</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {patient.vitalSigns.heartRate} bpm
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Thermometer className="size-5 text-orange-500" />
                  <span className="text-sm text-slate-600">Temperature</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {patient.vitalSigns.temperature}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wind className="size-5 text-blue-500" />
                  <span className="text-sm text-slate-600">Respiratory Rate</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {patient.vitalSigns.respiratoryRate} /min
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplet className="size-5 text-cyan-500" />
                  <span className="text-sm text-slate-600">O₂ Saturation</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {patient.vitalSigns.oxygenSaturation}%
                </span>
              </div>
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
                  {new Date(patient.arrivalTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Wait Time</p>
                <p className="font-medium text-slate-900">{getWaitTime(patient.arrivalTime)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Assigned Department</p>
                <p className="font-medium text-slate-900">{patient.assignedDepartment}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Assigned Doctor</p>
                <p className="font-medium text-slate-900">{patient.assignedDoctor}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Medical Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="current" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="current">Current Visit</TabsTrigger>
              <TabsTrigger value="history">Medical History</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chief Complaint</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-900 font-medium mb-4">{patient.chiefComplaint}</p>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Reported Symptoms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.symptoms.map((symptom, idx) => (
                        <Badge key={idx} variant="secondary">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.medicalHistory.length > 0 ? (
                    <div className="space-y-4">
                      {patient.medicalHistory.map((entry, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50 rounded-r-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{entry.condition}</h4>
                            <span className="text-sm text-slate-600">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium">Treatment:</span> {entry.treatment}
                          </p>
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium">Provider:</span> {entry.doctor}
                          </p>
                          <p className="text-sm text-slate-600">{entry.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-8">No medical history on record</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="size-5" />
                    Current Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.currentMedications.length > 0 ? (
                    <div className="space-y-2">
                      {patient.currentMedications.map((medication, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Pill className="size-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{medication}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-8">No current medications</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allergies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-red-500" />
                    Known Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.allergies.length > 0 ? (
                    <div className="space-y-2">
                      {patient.allergies.map((allergy, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <AlertTriangle className="size-5 text-red-600" />
                          <p className="font-medium text-red-900">{allergy}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-8">No known allergies</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
