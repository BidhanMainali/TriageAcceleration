import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router";

const commonSymptoms = [
  "Chest pain",
  "Shortness of breath",
  "Abdominal pain",
  "Fever",
  "Cough",
  "Headache",
  "Nausea",
  "Vomiting",
  "Dizziness",
  "Weakness",
  "Confusion",
  "Bleeding",
  "Swelling",
  "Pain",
];

export default function PatientCheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    fullName: "",
    dateOfBirth: "",
    gender: "",
    healthNumber: "",
    contactNumber: "",
    emergencyContact: "",
    bloodType: "",

    // Medical Info
    allergies: "",
    currentMedications: "",

    // Current Visit
    chiefComplaint: "",
    symptoms: [] as string[],
    symptomDetails: "",
  });

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate a patient ID
    const patientId = `P${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    // Navigate to status page with the new patient ID
    navigate(`/patient/status?id=${patientId}&new=true`);
  };

  const canProceedStep1 = formData.fullName && formData.dateOfBirth && formData.gender && formData.healthNumber && formData.contactNumber;
  const canProceedStep2 = formData.chiefComplaint && formData.symptoms.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link to="/patient">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Check-In</h1>
            <p className="text-slate-600">Please provide your information for triage assessment</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </div>
                <span className="text-sm font-medium text-slate-700">Personal Info</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-slate-200">
                <div className={`h-full bg-blue-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </div>
                <span className="text-sm font-medium text-slate-700">Symptoms</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-slate-200">
                <div className={`h-full bg-blue-600 transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className="flex items-center gap-2">
                <div className={`size-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </div>
                <span className="text-sm font-medium text-slate-700">Review</span>
              </div>
            </div>
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="healthNumber">BC Health Number *</Label>
                  <Input
                    id="healthNumber"
                    placeholder="e.g., BC-1234-567-890"
                    value={formData.healthNumber}
                    onChange={(e) => setFormData({ ...formData, healthNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact">Contact Number *</Label>
                    <Input
                      id="contact"
                      type="tel"
                      placeholder="(604) 555-0123"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      placeholder="Name & Number"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bloodType">Blood Type (if known)</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => setFormData({ ...formData, bloodType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    placeholder="e.g., Penicillin, Shellfish (separate with commas)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    placeholder="List any medications you are currently taking"
                    value={formData.currentMedications}
                    onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                    Next: Symptoms
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Symptoms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="complaint">What brought you to the hospital today? *</Label>
                  <Textarea
                    id="complaint"
                    placeholder="Describe your main complaint or reason for visit"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Select all symptoms you are experiencing: *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {commonSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={formData.symptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <label
                          htmlFor={symptom}
                          className="text-sm text-slate-700 cursor-pointer"
                        >
                          {symptom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="symptomDetails">Additional Details</Label>
                  <Textarea
                    id="symptomDetails"
                    placeholder="Please provide any additional information about your symptoms (severity, duration, etc.)"
                    value={formData.symptomDetails}
                    onChange={(e) => setFormData({ ...formData, symptomDetails: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                    Next: Review
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Personal Information</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                    <p><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</p>
                    <p><span className="font-medium">Gender:</span> {formData.gender}</p>
                    <p><span className="font-medium">Health Number:</span> {formData.healthNumber}</p>
                    <p><span className="font-medium">Contact:</span> {formData.contactNumber}</p>
                    {formData.emergencyContact && (
                      <p><span className="font-medium">Emergency Contact:</span> {formData.emergencyContact}</p>
                    )}
                    {formData.bloodType && (
                      <p><span className="font-medium">Blood Type:</span> {formData.bloodType}</p>
                    )}
                    {formData.allergies && (
                      <p><span className="font-medium">Allergies:</span> {formData.allergies}</p>
                    )}
                    {formData.currentMedications && (
                      <p><span className="font-medium">Medications:</span> {formData.currentMedications}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Current Visit</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                    <p><span className="font-medium">Chief Complaint:</span> {formData.chiefComplaint}</p>
                    <div>
                      <span className="font-medium">Symptoms:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.symptoms.map((symptom) => (
                          <span key={symptom} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                    {formData.symptomDetails && (
                      <p><span className="font-medium">Additional Details:</span> {formData.symptomDetails}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">
                    By submitting this form, you confirm that the information provided is accurate.
                    Our AI system will assess your symptoms and assign you to the appropriate medical team.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={isSubmitting}>
                    <ArrowLeft className="size-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Check-In'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
