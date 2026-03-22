import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Activity, UserPlus, Search } from "lucide-react";

export default function PatientPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Activity className="size-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Hospital Check-In</h1>
          </div>
          <p className="text-lg text-slate-600">Welcome to our Emergency Department</p>
        </div>

        {/* Main Options */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/patient/checkin">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500 h-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 size-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="size-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">New Patient Check-In</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 mb-4">
                  Register as a new patient and submit your symptoms for triage assessment
                </p>
                <Button className="w-full" size="lg">
                  Start Check-In
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/patient/status">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-500 h-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 size-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Search className="size-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Check Queue Status</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 mb-4">
                  View your current position in the queue and estimated wait time
                </p>
                <Button className="w-full" size="lg" variant="outline">
                  Check Status
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">What to expect:</h3>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Complete the check-in form with your information and symptoms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Our AI system will assess your symptoms and assign a triage priority</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>You'll be matched with the appropriate department and medical staff</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>Track your queue position and receive real-time updates</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Switch to Doctor Portal */}
        <div className="text-center mt-8">
          <Link to="/">
            <Button variant="ghost" className="text-slate-600">
              Healthcare Provider? Access Doctor Portal →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
