






![MediAI Hero Image](https://i.ibb.co.com/JFFfKCf4/Home-Page.png)  






### MediAI - Project Description  

 MediAI is an innovative, AI-centric healthcare management platform built on the MERN stack (MongoDB, Express.js, React.js, Node.js). It revolutionizes patient-doctor interactions by placing artificial intelligence at the core of doctor discovery, personalized recommendations, and intelligent system assistance, making healthcare more accessible, intuitive, and efficient.


### Live Demo / Deployment Link
**[Live Demo - MediAI](https://mediai-yourproject.vercel.app)**  
*(Link will be updated once the project is fully deployed on Vercel/Render)*


### Group Members
- MD SAIDUL ISLAM APU
- KHALID ABRAR LABIB
- MALIHA RAHMAN
- OWARA BINTE MAMUN
### Tech Stack
- **Language:** MERN (MongoDB, Express.js, React.js, Node.js)
- **Framework:** React.js
- **Styling:** Daisy UI, Tailwind CSS
- **Database:** MongoDB
- **ORM/DB Access:** Prisma, MongoDB Native Driver
- **Deployment:** Vercel (Frontend) / Render (Backend)
- **Real-time Communication:** Socket.io, WebSocket
- **AI Integration:** Google Gemini API

---

### Functional Requirements by Team Member

#### Member-1: MD SAIDUL ISLAM APU

**1. Authentication and Role-Based Features**  
This module manages Login, Logout, Registration, Password Management, Role-Based Access Control, and Google Authentication, ensuring a secure and user-friendly experience.

- **User Registration & Validation**  
  Users must provide Name, Email, Date of Birth, Gender, and Password. Validation checks completeness and email format. Duplicate email/user triggers: “Account already exists. Try logging in.” (React Toastify/SweetAlert).

- **Password Management**  
  Users confirm current password before updating. Error: “Current password doesn’t match.” Success: “Password updated successfully.” with session refresh.

- **Role-Based Access Control**  
  JWT decoded on login to determine role (Admin, Patient/User, Doctor). Role-specific permissions and routes. Unauthorized access redirects to “403 – Access Denied” page.

- **Google Authentication**  
  Login via Google (Supabase/Clerk). On success: verify credentials, store/update user data, issue JWT, redirect to dashboard. On failure: “Google authentication failed. Please try again.”

**2. Activity Logs & History**  
Maintains detailed logs for critical actions (authentication, password changes, role modifications).

- Automatic entry creation in Activity Logs collection.
- Admin can filter by User (ID/name), Date range (e.g., today, last week), Activity Type (Login, Password Change, Role Modification).
- Dynamic table: User ID, Action Type, Description, Timestamp.
- Error handling: “Unable to fetch logs. Try again later.” / “No logs found for the selected criteria.”

**3. Search & AI Doctor Finder**  
Enables real-time and AI-powered doctor discovery.

- Real-time search by name/specialty with instant suggestions and grid results (Name, Specialty, Ratings, Availability, Profile Link).
- AI Doctor Finder (Google Gemini API): processes natural language prompts (e.g., “Find a heart specialist near me” or “I have a kidney problem”) → extracts terms → maps to specialties (e.g., Cardiology, Urology) → returns relevant doctors with Name, Specialty, Location, Rating, Availability.
- Error messages: “No doctors found matching your search. Please try a different search term.” / “Something went wrong while fetching results. Please try again later.”

**4. Emergency & On-Call Appointments**  
“Emergency Appointment” button bypasses standard scheduling and sends real-time alerts (Socket.io/WebSocket) to on-call doctors and admins.  
- Doctor accepts → patient assigned slot (visible to admin).  
- Doctor rejects → appointment marked as rejected.

#### Member-2: KHALID ABRAR LABIB

**1. Doctor Dashboard**  
Centralized real-time dashboard for doctors to manage appointments and performance.

- **Today’s Appointments:** List with patient name, time, status; actions for details, prescriptions, telemedicine start.
- **Upcoming Appointments:** Future schedule with quick actions.
- **Patient List Summary:** Patients seen/scheduled with medical history access.
- **Weekly Statistics Summary:** Total appointments, new patients, revenue (optional daily volume chart).
- **Scheduling Management:** Doctors define available slots (real-time sync for patients).

**2. Notifications**  
Real-time notifications for appointment events.

- Booking, Cancellation, Rescheduling notifications with details (date, time, doctor name).
- Patient dashboard notification icon/list with summaries.
- Click opens modal with full details (doctor, specialization, status).
- Asynchronous processing (failures do not block core actions).

**3. Mapping Descriptions to Specialties**  
Analyzes patient queries to match specialties (e.g., “heart specialist” → Cardiology). Supports location filtering via hospital data.

**4. Real-Time Dashboard Updates**  
Doctor dashboard instantly reflects bookings, cancellations, reschedules without refresh. Connection issues show restoration message.

**5. Health Tools & Insights**

- **BMI Calculator:** Weight/height input → category (underweight/normal/overweight/obese), saved with date for trends. Validation and error handling.
- **Water Intake Tracker:** Set daily goals, log intake, progress tracking, reminders, daily/weekly summaries.
- **Sleep Duration Tracker:** Log bedtime/wake-up, calculate hours, rate quality (Poor/Average/Good), weekly averages.

**6. Follow-Up Appointments**  
- Doctors schedule follow-ups post-consultation (pre-filled details, tagged “Follow-Up”).
- Automated reminder notifications.
- Emergency on-call alerts.
- Patient dashboard display with status.
- Success: “Follow-up appointment scheduled successfully.” Error: “Failed to schedule follow-up appointment. Try again later.”

#### Member-3: MALIHA RAHMAN

**1. Doctor Profile Page**  
Professional read-only overview: profile picture, name, qualifications, specialization, experience, biography, ratings/reviews, availability, contact, total patients served, accomplishments/certifications. “Edit Profile” button → User Settings.

**2. Patient Profile Page**  
Personalized read-only view: picture, name, contact, DOB, prescriptions, consultation history (visible only to patient and appointed doctors). “Edit Profile” button → User Settings. Other users see read-only version.

**3. User Settings Page (Doctors & Patients)**  
Editable form: Name, Phone, DOB, professional details (doctors), profile picture upload. Validation required.  
- Success: “Profile updated successfully.”  
- Error: “Error uploading profile picture.”  
Password change: Current, New, Confirm fields. Messages: “Password updated successfully” or “Current password doesn’t match.”

**4. Patient Dashboard**  
- Upcoming & Past Appointments sections.
- Details: doctor name, specialization, date/time, payment status.
- Actions: View Details, Reschedule, Cancel.
- “Join Consultation” button for online appointments.

**5. Admin Dashboard**  
Secure access with metrics: Total Doctors, Patients, Appointments (Booked/Completed), Revenue (weekly/monthly charts).  
User Management: searchable/filterable list → detailed view (name, role, email, registration/last login, status, associated data links).

**6. Telemedicine Setup**  
Secure online consultations.

- Doctor: “Start Consultation” (visible during scheduled time), video/audio/chat, patient profile access, prescription form, screen share, outcome marking.
- Patient: “Join Consultation”, pre-call checklist (camera/microphone), post-session prescription access & rating.
- Telemedicine History: past sessions with dates, doctors, prescription links.
- Status messages: “Not consultation time yet”, “Waiting for patient to join…”, “Appointment Cancelled”.

#### Member-4: OWARA BINTE MAMUN

**1. Patient Appointment Booking Flow**  
Patients book only within doctor-defined available slots. Real-time availability check.  
- Slot taken: “Slot is already booked.”  
- General error: “Error booking the appointment. Please try again.”

**2. Doctor Profile Cards**  
Snapshot cards: name, specialization, fees, ratings. “View Profile” button → detailed profile page.

**3. Appointment Payments & Invoices**  
Secure (dummy) payment gateway after slot selection.  
- Success: store transaction (Payment ID, User ID, Appointment ID, Amount, Timestamp), auto-generate PDF invoice.  
- Failure: “Transaction failed. Please check your card or network.”

**4. Booking Screen**  
Flow: select doctor → specialization → date/time → confirm → payment screen → process payment.

**5. Prescription Form Design & Upload**  
Form fields: Medicine (required), Dosage (required), Instructions (optional).  
- Validation before submission.
- POST with appointment/patient ID.
- Patients view/download prescription list in profile.
- Error: “Failed to upload prescription. Try again.”

**6. Favorites, Ratings & Reporting**

- **Favorites:** “Favorite” button → stores doctor ID in patient favorites → dedicated Favorites page with doctor cards.
- **Rating System:** Weighted average displayed on profile (e.g., “4.5 stars”, total reviews).
- **Reporting:** “Report” button → description → stored in reports table → doctor flagged “Under Review” → admin notified.

**7. User Action Feedback**  
Success messages: “Doctor added to favorites!”, “Rating submitted successfully!”, “Report submitted for review.”  
Error messages: “Error adding to favorites. Try again.” etc.

**8. Handling Reported Doctors (Admin)**  
Admin panel: In-Progress & Resolved reports.  
- Details: doctor name, specialty, reporter, description.
- Actions: Ban Doctor, Delete Profile, Ignore Report (with confirmation modal).
- Status auto-updates to Resolved after action.

---

**MediAI** – A comprehensive, secure, real-time healthcare management platform with intelligent AI assistance and seamless user experience.
