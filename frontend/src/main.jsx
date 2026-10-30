import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Check if we are in production; otherwise, use localhost
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from './Components/ErrorPage.jsx'
import Home from './Components/Home/Home.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './Components/Auth/Login.jsx';
import Register from './Components/Auth/Register.jsx';
import { AuthProvider } from './Components/Auth/AuthProvider.jsx';
import Protected from './Components/Auth/ProtectedRoute.jsx'

import Users from './Components/Users/Users.jsx';
import UserSettings from './Components/Profiles/usersettings.jsx';
import HealthTools from './Components/HealthTools/HealthTools.jsx';
import BMICalculator from './Components/HealthTools/BMICalculator.jsx';
import WaterIntakeTracker from './Components/HealthTools/WaterIntakeTracker.jsx';
import SleepDurationTracker from './Components/HealthTools/SleepDurationTracker.jsx';
import DoctorCard from './Components/Doctor/DoctorsCard.jsx';


// Doctor features
import DoctorProfile from './Components/Doctor/DoctorProfile.jsx';
import DoctorSchedule from './Components/Doctor/DoctorSchedule.jsx';
import BookingScreen from './Components/booking/BookingScreen.jsx';
import PatientBooking from './Components/booking/PatientBooking.jsx';
import PaymentPage from './Components/Payment/PaymentPage.jsx';
import InvoicePage from './Components/Payment/InvoicePage.jsx';
import BookEmergencyAppointment from './Components/Doctor/BookEmergencyAppointment.jsx';
import DoctorEmergencyList from './Components/Doctor/DoctorEmergencyList.jsx';
import PatientEmergencyList from './Components/Doctor/PatientEmergencyList.jsx'
import MyAppointments from './Components/Dashboard/MyAppointments.jsx';
import DoctorPatients from './Components/Doctor/DoctorPatients.jsx';
import Service from './Components/Service.jsx'
import AboutUs from './Components/About.jsx'
import AdminReportsPage from './Components/Admin/AdminReportsPage.jsx';
import Doctors from './Components/Admin/Doctors.jsx';
import FavoritesPage from './Components/Favorites/FavoritesPage.jsx';
import DoctorSchedulePage from './Components/Doctor/DoctorSchedulePage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    //Apu part start-----------------------------------------------------------
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/services",
        element: <Service />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/about",
        element: <AboutUs />,
      },
      {
        path: "/admin/reports",
        element:
          <Protected>
            <AdminReportsPage />
          </Protected>
      },
      {
        path: "/admin/doctors",
        element:
          <Protected>
            <Doctors />
          </Protected>
      },
      {
        path: "/favorites",
        element:
          <Protected>
            <FavoritesPage />
          </Protected>
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/users",
        element:
          <Protected>
            <Users />
          </Protected >,
      },
      {
        path: "/emergency-appointment",
        element:
          <Protected>
            <BookEmergencyAppointment />
          </Protected >,
      },
      {
        path: "/patient-emergencies",
        element:
          <Protected>
            <PatientEmergencyList />
          </Protected >,
      },
      {
        path: "/doctor-emergency",
        element:
          <Protected>
            <DoctorEmergencyList />
          </Protected >,
      },
      {
        path: "/doctor/schedule-page",
        element: 
          <Protected>
            <DoctorSchedulePage />
          </Protected >,
      },
      {
        path: "/user-settings",
        element: (
          <Protected>
            <UserSettings />
          </Protected>
        ),
      },
      {
        path: "/health-tools",
        element: (
          <Protected>
            <HealthTools />
          </Protected>
        ),
      },
      {
        path: "/health-tools/bmi",
        element: (
          <Protected>
            <BMICalculator />
          </Protected>
        ),
      },
      {
        path: "/health-tools/water",
        element: (
          <Protected>
            <WaterIntakeTracker />
          </Protected>
        ),
      },
      {
        path: "/health-tools/sleep",
        element: (
          <Protected>
            <SleepDurationTracker />
          </Protected>
        ),
      },
      //Apu part end-------------------------------------------------------------------

      // Doctor Routes
      {
        path: "/doctorCard",
        element: <DoctorCard />,
      },
      {
        path: "/doctor/:id",
        element: <DoctorProfile />,
      },
      {
        path: "/doctor/:id/schedule",
        element: (
          <Protected>
            <DoctorSchedule />
          </Protected>
        ),
      },
      {
        path: "/doctor/patients",
        element: (
          <Protected>
            <DoctorPatients />
          </Protected>
        ),
      },

      // Patient Booking Flow
      {
        path: "/book-appointment",
        element: (
          <Protected>
            <BookingScreen />
          </Protected>
        ),
      },
      // Simple slot picker page
      {
        path: "/book/:doctorId",
        element: (
          <Protected>
            <PatientBooking />
          </Protected>
        ),
      },
      {
        path: "/appointments/my",
        element: (
          <Protected>
            <MyAppointments />
          </Protected>
        ),
      },

      // Payment
      {
        path: "/payment/:appointmentId/:amount",
        element: (
          <Protected>
            <PaymentPage />
          </Protected>
        ),
      },
      // Invoice
      {
        path: "/invoice/:paymentId",
        element: (
          <Protected>
            <InvoicePage />
          </Protected>
        ),
      },


    ]
  },
  // add more routes as needed
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  </StrictMode>,
)