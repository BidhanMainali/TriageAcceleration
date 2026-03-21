import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import PatientQueue from "./pages/PatientQueue";
import PatientDetails from "./pages/PatientDetails";
import Layout from "./components/Layout";
import PatientPortal from "./pages/patient/PatientPortal";
import PatientCheckIn from "./pages/patient/PatientCheckIn";
import PatientStatus from "./pages/patient/PatientStatus";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "queue", Component: PatientQueue },
      { path: "patient/:patientId", Component: PatientDetails },
    ],
  },
  {
    path: "/patient",
    children: [
      { index: true, Component: PatientPortal },
      { path: "checkin", Component: PatientCheckIn },
      { path: "status", Component: PatientStatus },
    ],
  },
]);