import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  type RoutingDecision,
  type Department,
  type StaffMember,
  getStaffByDepartment,
  confirmRouting,
} from "../../lib/api";

interface RoutingDecisionPanelProps {
  patientId: string;
  routing: RoutingDecision;
  departments: Department[];
  onRouted: () => void;
}

export default function RoutingDecisionPanel({
  patientId,
  routing,
  departments,
  onRouted,
}: RoutingDecisionPanelProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    routing.recommended_dept_id || ""
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    routing.recommended_doctor_id || ""
  );
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(routing.confirmed);

  const scores = (routing.department_scores || []).sort(
    (a, b) => b.score - a.score
  );

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

  useEffect(() => {
    if (!selectedDeptId) return;
    getStaffByDepartment(selectedDeptId)
      .then((staff) => {
        const deptDoctors = staff.filter((s) => s.role === "doctor");
        setDoctors(deptDoctors);
        // If switching departments, pre-select first available doctor
        if (selectedDeptId !== routing.recommended_dept_id) {
          setSelectedDoctorId(deptDoctors[0]?.id || "");
        }
      })
      .catch(() => setDoctors([]));
  }, [selectedDeptId, routing.recommended_dept_id]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const isOverride =
        selectedDeptId !== routing.recommended_dept_id ||
        selectedDoctorId !== routing.recommended_doctor_id;

      await confirmRouting(
        patientId,
        true,
        isOverride ? selectedDeptId : undefined,
        isOverride ? selectedDoctorId : undefined
      );
      setConfirmed(true);
      onRouted();
    } catch {
      alert("Failed to confirm routing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    const finalDept = deptMap[selectedDeptId];
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-8 text-center">
          <CheckCircle className="size-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 text-lg mb-1">
            Patient Routed Successfully
          </h3>
          <p className="text-green-800">
            Routed to {finalDept?.name || selectedDeptId}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Top Recommendation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-5 text-blue-600" />
            AI Recommendation
            {routing.confidence && (
              <Badge variant="default">
                {Math.round(routing.confidence * 100)}% confidence
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 mb-3">{routing.ai_reasoning}</p>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-4 text-blue-600" />
            <span className="text-sm font-medium">
              Recommended:{" "}
              {deptMap[routing.recommended_dept_id || ""]?.name || "Unknown"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Department Scores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-5" />
            Department Scores — Select Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scores.map((ds) => {
            const dept = deptMap[ds.department_id];
            if (!dept) return null;
            const isRecommended =
              ds.department_id === routing.recommended_dept_id;
            const isSelected = ds.department_id === selectedDeptId;

            return (
              <div
                key={ds.department_id}
                onClick={() => setSelectedDeptId(ds.department_id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {dept.name}
                    </span>
                    {isRecommended && (
                      <Badge
                        variant="default"
                        className="text-xs"
                      >
                        AI Pick
                      </Badge>
                    )}
                    {isSelected && !isRecommended && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {dept.current_load}/{dept.capacity} patients
                    </span>
                    <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                      {Math.round(ds.score * 100)}%
                    </span>
                  </div>
                </div>
                <Progress value={ds.score * 100} className="h-2 mb-1" />
                <p className="text-xs text-slate-600 mt-1">{ds.reasoning}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Doctor Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="size-5" />
            Assign Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length > 0 ? (
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization} ({doc.current_patient_count}{" "}
                    patients)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-slate-500">
              No doctors available for this department
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={loading || !selectedDeptId}
        className="w-full"
        size="lg"
      >
        {loading ? "Confirming..." : "Confirm Routing"}
      </Button>
    </div>
  );
}
