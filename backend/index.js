const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const { Server } = require("socket.io");
const http = require("http");
// Note: Using agora-access-token (deprecated but works). For production, use 'agora-token' package
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Config
dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, "https://medi-ai-beta.vercel.app", "http://localhost:5173", "http://localhost:5174"],
        credentials: true,
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// CORS configuration
const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
const defaultOrigins = [
    'https://medi-ai-beta.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];


const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        "https://medi-ai-beta.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
  }),
);

// Preflight handling for ALL routes

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

const cookieParser = require("cookie-parser");
app.use(cookieParser());
// MongoDB
let uri = process.env.MONGODB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mediai.zwtbiw4.mongodb.net/?appName=mediai`;
let client = new MongoClient(uri, {
  serverApi: uri.includes("mongodb+srv") ? {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  } : undefined,
});

async function run() {
  try {
    console.log("Attempting to connect to MongoDB...");
    try {
      await client.connect();
      console.log("Connected to MongoDB successfully!");
    } catch (connErr) {
      console.warn("Primary MongoDB connection failed (" + connErr.message + "). Starting in-memory MongoDB fallback...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      client = new MongoClient(uri);
      await client.connect();
      console.log("Connected to in-memory MongoDB successfully at:", uri);
    }


        // Test CORS/Connection endpoint
        app.get("/test-cors", (req, res) => {
            res.status(200).json({ message: "Connection successful" });
        });

        // JWT Protected Example
        app.get("/protected", (req, res) => {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) return res.status(401).json({ message: "No token provided" });
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                res.status(200).json({ message: "Access granted", user: decoded });
            } catch (error) {
                res.status(403).json({ message: "Invalid or expired token" });
            }
        });


    // Middleware to verify JWT
    const verifyJWT = (req, res, next) => {
      const authorization = req.headers.authorization;
      // console.log("JWT Middleware - Header:", authorization); // DEBUG

      if (!authorization) {
        return res
          .status(401)
          .json({ error: true, message: "Unauthorized access" });
      }

      const token = authorization.split(" ")[1];
      // console.log("JWT Middleware - Extracted Token:", token); // DEBUG

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    console.error("JWT Middleware - Token verification failed:", error.message);
                    return res.status(403).json({ error: true, message: "Forbidden access" });
                }
                console.log(`[DEBUG] JWT Verified. User parsed: ID=${decoded.id}, Role=${decoded.role || decoded.userRole}`);
                req.user = decoded;
                next();
            });
        };

        // Collections---------------------------------------------------
        const usersCollection = client.db("mediAi").collection("users"); // Stores user accounts (email, password, role, registration date)
        const userinfoCollection = client.db("mediAi").collection("userinfo"); // Stores patient profile information (gender, DOB, phone, photo)
        const doctorinfoCollection = client.db("mediAi").collection("doctorinfo"); // Stores doctor profile information (specialization, bio, availability) (linked to users via userId)
        const appointmentsCollection = client.db("mediAi").collection("appointments"); // Stores appointment details (doctor, patient using IDs, date, time, status)
        const patientsCollection = client.db("mediAi").collection("patients"); // Stores patient records linked to doctors (name, condition, lastVisit, nextVisit)
        const schedulesCollection = client.db("mediAi").collection("schedules"); // Stores doctor availability slots (day, start time, end time, duration per appointment)
        const transactionsCollection = client.db("mediAi").collection("transactions"); // Stores payment transactions
        const EmergencyCollection = client.db("mediAi").collection("emergency"); // Stores emergency contact information
        const consultationsCollection = client.db("mediAi").collection("consultations"); // Stores consultation records
        const ratingsCollection = client.db("mediAi").collection("ratings"); // Stores doctor ratings and reviews
        const reportsCollection = client.db("mediAi").collection("reports"); // Stores doctor reports
        const prescriptionsCollection = client.db("mediAi").collection("prescriptions"); // Stores all prescriptions
        const doctorRequestsCollection = client.db("mediAi").collection("doctorRequests"); // Stores requests to become a doctor
        const bmiCollection = client.db("mediAi").collection("bmi"); // Stores BMI records
        const waterCollection = client.db("mediAi").collection("water"); // Stores water intake records
        const sleepCollection = client.db("mediAi").collection("sleep"); // Stores sleep records

    // ===========================Apu part start=============================================================================

    //AI search Start(Apu)-------------------------------------------------------

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let SELECTED_GEMINI_MODEL = process.env.GEMINI_MODEL || null;


        // Helper to populate appointment names
        async function populateAppointmentDetails(appointments) {
            if (!appointments || appointments.length === 0) return [];

            const patientIds = [...new Set(appointments.map(a => a.patientId))].filter(id => id && ObjectId.isValid(id)).map(id => new ObjectId(id));
            const doctorIds = [...new Set(appointments.map(a => a.doctorId))].filter(id => id && ObjectId.isValid(id)).map(id => new ObjectId(id));

            // Fetch user details for all unique IDs
            const users = await usersCollection.find({ _id: { $in: [...patientIds, ...doctorIds] } }).toArray();
            const userMap = users.reduce((acc, user) => {
                acc[user._id.toString()] = user.displayName || user.fullName || user.name;
                return acc;
            }, {});

            return appointments.map(apt => ({
                ...apt,
                patientName: userMap[apt.patientId?.toString()] || apt.patientDetails?.fullName || "Unknown Patient",
                doctorName: userMap[apt.doctorId?.toString()] || "Unknown Doctor"
            }));
        }

    // Detect latest available Gemini model if not set
    async function detectGeminiModel(apiKey) {
      if (!apiKey) return null;
      try {
        const fetchFn = global.fetch || (await import("node-fetch")).default;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetchFn(url);
        const body = await res.json();
        if (!Array.isArray(body.models)) return null;

        const candidates = body.models
          .map((m) => m.name.replace(/^models\//, ""))
          .filter(
            (name) => name.startsWith("gemini") && !name.includes("embed"),
          );
        return candidates[0] || null;
      } catch (err) {
        console.error("detectGeminiModel error:", err);
        return null;
      }
    }

    // Initialize selected model
    (async () => {
      if (!SELECTED_GEMINI_MODEL) {
        SELECTED_GEMINI_MODEL = await detectGeminiModel(
          process.env.GEMINI_API_KEY,
        );
        console.log(
          "Using Gemini model:",
          SELECTED_GEMINI_MODEL || "gemini-1.5-flash",
        );
      }
    })();

    async function retryGenerate(prompt, retries = 3, delay = 1000) {
      for (let i = 0; i < retries; i++) {
        try {
          return await generateWithFallback(prompt);
        } catch (err) {
          if (i === retries - 1) throw err;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2; // exponential backoff
        }
      }
    }
    // // Example for POST /aisearch
    app.post("/aisearch", async (req, res) => {
      try {
        const { query } = req.body;
        if (!query) {
          return res.status(400).json({ specialties: [] });
        }
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });
        const prompt = `
                        You are a medical assistant.
                        User symptom: "${query}"

                        Analyze the symptom and return ONLY a comma-separated list
                        of relevant doctor specialties.

                        Example output:
                        Cardiology, Pulmonology
                        `;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Gemini response:", text);
        const specialties = text
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        res.json({ specialties });
      } catch (err) {
        console.error("Gemini API Error:", err);
        res.status(500).json({ specialties: [] });
      }
    });

    // ---------------- LIST MODELS ----------------
    app.get("/list-models", async (req, res) => {
      try {
        const models = await genAI.listModels();
        res.json(models);
      } catch (err) {
        console.error("ListModels error:", err);
        res.status(500).json({ error: "Failed to list models" });
      }
    });
    //AI search End(Apu)-------------------------------------------------------

    // -------------------- Fetch Doctor Schedules --------------------
    app.get("/doctor/:doctorId/schedules", async (req, res) => {
      try {
        const { doctorId } = req.params;
        const schedules = await schedulesCollection
          .find({ doctorId })
          .sort({ day: 1 })
          .toArray();
        if (!schedules.length)
          return res.status(200).json({ message: "No schedules found" });
        const formattedSchedules = schedules.map((schedule) => ({
          ...schedule,
          _id: schedule._id.toString(),
        }));
        res.status(200).json(formattedSchedules);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error fetching schedule", error: error.message });
      }
    });

    // Emergency appoinment Start(Apu)---------------

    app.post("/emergency/book", verifyJWT, async (req, res) => {
      try {
        const patientId = new ObjectId(req.user.id); // from JWT

        const {
          doctorId,
          scheduleId,
          details,
          fullName,
          email,
          gender,
          dob,
          phoneNumber,

          meetingType = "physical",
        } = req.body;

                if (!doctorId || !details) {
                    return res
                        .status(400)
                        .json({ message: "doctorId and details required" });
                }

                let schedule = null;
                if (scheduleId && ObjectId.isValid(scheduleId)) {
                    schedule = await schedulesCollection.findOne({
                        _id: new ObjectId(scheduleId),
                        doctorId: doctorId.toString(),
                        isBooked: { $ne: true }
                    });

                    if (!schedule) {
                        return res
                            .status(404)
                            .json({ message: "Invalid schedule or already booked" });
                    }
                }

        const doctor = await doctorinfoCollection.findOne({
          $or: [
            { _id: new ObjectId(doctorId) },
            { userId: doctorId },
            { userId: new ObjectId(doctorId) },
          ],
        });

        const doctorName = doctor ? doctor.fullName : "Unknown Doctor";
        const consultationFee = doctor?.consultationFee || 0;
        const totalFee = parseInt(consultationFee) + 500;

        // only for telemedicine
        let agoraConfig = null;

        if (meetingType === "telemedicine") {
          const channelName = `meeting_${scheduleId}_${Date.now()}`;
          agoraConfig = {
            channelName,
            token: "GENERATE_TOKEN_HERE",
            uid: Math.floor(Math.random() * 100000),
          };
        }

                const emergencyDoc = {
                    patientId,
                    doctorId: doctorId.toString(),
                    doctorName,
                    scheduleId: schedule ? schedule._id : null,
                    details,
                    fullName,
                    email,
                    gender,
                    dob,
                    phoneNumber,

                    slotTime: schedule ? {
                        day: schedule.day,
                        start: schedule.start,
                        end: schedule.end || schedule.start,
                        duration: schedule.duration || 0
                    } : {
                        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                        start: "ASAP",
                        end: "ASAP",
                        duration: 0
                    },

          status: "pending",
          checkUp: "Not",

                    meetingType,
                    paymentStatus: "unpaid",
                    fee: totalFee,
                    agoraConfig,

                    appointmentDate: (() => {
                        const d = new Date();
                        d.setUTCHours(0, 0, 0, 0);
                        return d;
                    })(),

          createdAt: new Date(),
          updatedAt: null,
        };

                const result = await EmergencyCollection.insertOne(emergencyDoc);

                // Update schedule to isBooked: true
                await schedulesCollection.updateOne(
                    { _id: new ObjectId(scheduleId) },
                    { $set: { isBooked: true } }
                );

        res.status(201).json({
          success: true,
          emergencyId: result.insertedId,
          status: "pending",
          checkUp: "Not",
          meetingType,
          paymentStatus: "unpaid",
          fee: totalFee,
        });
      } catch (error) {
        console.error("Emergency booking error:", error);
        res.status(500).json({ message: "Emergency booking failed" });
      }
    });

    //patient emergency list start------------------------
    // app.get("/emergency/patient", verifyJWT, async (req, res) => {
    //     try {
    //         if (!req.user || req.user.userRole !== "user") {
    //             return res.status(403).json({ message: "Patients only" });
    //         }
    //         const patientId = new ObjectId(req.user.id);
    //         const emergencies = await EmergencyCollection.find(
    //             { patientId },
    //             {
    //                 projection: {
    //                     doctorName: 1,
    //                     details: 1,
    //                     status: 1,
    //                     slotTime: 1,
    //                     checkUp: 1,
    //                     updatedAt: 1,
    //                     createdAt: 1,
    //                 },
    //             }
    //         )
    //             .sort({ createdAt: -1 })
    //             .toArray();

    //         res.status(200).json(emergencies);
    //     } catch (error) {
    //         console.error("Error fetching patient emergencies:", error);
    //         res.status(500).json({ message: "Server error" });
    //     }
    // });

    app.get("/emergency/patient", verifyJWT, async (req, res) => {
      try {
        if (!req.user || req.user.userRole !== "user") {
          return res.status(403).json({ message: "Patients only" });
        }
        const patientId = new ObjectId(req.user.id);
        const emergencies = await EmergencyCollection.find(
          { patientId },
          {
            projection: {
              doctorName: 1,
              details: 1,
              status: 1,
              slotTime: 1,
              checkUp: 1,
              meetingType: 1,
              paymentStatus: 1,
              updatedAt: 1,
              createdAt: 1,
            },
          },
        )
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json(emergencies);
      } catch (error) {
        console.error("Error fetching patient emergencies:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.delete("/emergency/patient/:id", verifyJWT, async (req, res) => {
      try {
        // Allow both "patient" and "user" roles
        if (!["patient", "user"].includes(req.user.userRole)) {
          console.log("Access denied. Role:", req.user.userRole);
          return res.status(403).json({ message: "Patients only" });
        }
        const emergencyId = req.params.id;
        console.log(
          "Delete request for emergency ID:",
          emergencyId,
          "by user:",
          req.user.id,
        );
        // Find the emergency
        const emergency = await EmergencyCollection.findOne({
          _id: new ObjectId(emergencyId),
        });
        if (!emergency) {
          // console.log("Emergency not found:", emergencyId);
          return res.status(404).json({ message: "Emergency not found" });
        }
        // Ensure the emergency belongs to the logged-in user (fixed)
        if (emergency.patientId.toString() !== req.user.id.toString()) {
          console.log("User tried to delete another patient's emergency");
          return res
            .status(403)
            .json({ message: "You cannot delete this emergency" });
        }
        // console.log("Emergency found:", emergency);
        // Only allow delete if rejected OR accepted & checkUp is done
        if (
          !(
            emergency.status === "rejected" ||
            (emergency.status === "accepted" && emergency.checkUp === "Done")
          )
        ) {
          console.log(
            "Delete not allowed. Status:",
            emergency.status,
            "CheckUp:",
            emergency.checkUp,
          );
          return res
            .status(403)
            .json({ message: "Cannot delete this emergency yet" });
        }
        const result = await EmergencyCollection.deleteOne({
          _id: new ObjectId(emergencyId),
        });
        if (result.deletedCount === 1) {
          // console.log("Emergency deleted successfully:", emergencyId);
          return res.json({
            success: true,
            toast: "Emergency deleted successfully",
          });
        }
        // console.log("Delete failed for emergency:", emergencyId);
        res.status(400).json({ message: "Delete failed" });
      } catch (error) {
        // console.error("Delete Emergency Error:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    //patient emergency list end--------------------------

    //Doctor emrgency list start-------------------------

    // Get emergencies for logged-in doctor
    app.get("/emergency/doctor", verifyJWT, async (req, res) => {
      try {
        if (!req.user || req.user.userRole !== "doctor") {
          return res.status(403).json({ message: "Doctors only" });
        }

        const doctorId = req.user.id;

        const emergencies = await EmergencyCollection.find({
          doctorId: doctorId.toString(),
        })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json(emergencies);
      } catch (error) {
        console.error("Error fetching doctor emergencies:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // Update emergency status
    app.patch("/emergency/:id/status", verifyJWT, async (req, res) => {
      try {
        if (!req.user || req.user.userRole !== "doctor") {
          return res.status(403).json({ message: "Doctor only" });
        }

        const emergencyId = req.params.id;
        const { status, checkUp } = req.body;

        if (!status)
          return res.status(400).json({ message: "Status is required" });

        const updateDoc = {
          status,
          updatedAt: new Date(), // update timestamp
        };

        if (checkUp) {
          updateDoc.checkUp = checkUp;
        }

        const result = await EmergencyCollection.updateOne(
          { _id: new ObjectId(emergencyId), doctorId: req.user.id },
          { $set: updateDoc },
        );

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .json({ message: "Emergency not found or not assigned to you" });
        }

        res.status(200).json({
          message: "Emergency updated successfully",
          updatedFields: updateDoc,
        });
      } catch (error) {
        console.error("Error updating emergency:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // DELETE /doctor/emergency/:id

    app.delete("/doctor/emergency/:id", verifyJWT, async (req, res) => {
      try {
        // Doctor only
        if (req.user.userRole !== "doctor") {
          return res.status(403).send({ message: "Doctor only access" });
        }

        const emergencyId = req.params.id;

        const emergency = await EmergencyCollection.findOne({
          _id: new ObjectId(emergencyId),
        });

        if (!emergency) {
          return res.status(404).send({ message: "Emergency not found" });
        }

        // Doctor can delete ONLY own emergency
        if (emergency.doctorId !== req.user.id) {
          return res.status(403).send({ message: "Unauthorized delete" });
        }

        const result = await EmergencyCollection.deleteOne({
          _id: new ObjectId(emergencyId),
        });

        if (result.deletedCount === 1) {
          return res.send({
            success: true,
            toast: "Emergency deleted successfully",
          });
        }

        res.status(400).send({ message: "Delete failed" });
      } catch (error) {
        console.error("Delete Emergency Error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    //Doctor emergency list end----------------------------

    //Emergency appoinment End(Apu)---------------

    //user collection start(APU) -----------------------------------------------------------------------
    // Register route
    app.post("/register", async (req, res) => {
      console.log("Register endpoint hit");
      try {
        const { fullName, email, password } = req.body;
        console.log("Received data:", {
          fullName,
          email,
          password: password ? "***" : null,
        });
        if (!fullName || !email || !password) {
          console.log("Missing required fields");
          return res
            .status(400)
            .json({ message: "Full name, email and password are required" });
        }
        const existingUser = await usersCollection.findOne({ email });
        console.log(
          "Existing user check:",
          existingUser ? "User exists" : "No existing user",
        );
        if (existingUser) {
          console.log("Attempted to register an existing email:", email);
          return res.status(400).json({ message: "User already exists" });
        }
        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed");
        const newUser = {
          fullName,
          email,
          password: hashedPassword,
          userRole: "user",
          registrationDate: new Date(),
        };
        console.log("New user object prepared:", newUser);
        const result = await usersCollection.insertOne(newUser);
        console.log("User inserted with ID:", result.insertedId);
        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertedId,
        });
      } catch (error) {
        console.error("Error in /register:", error);
        res
          .status(500)
          .json({ message: "Error registering user", error: error.message });
      }
    });

    // Get all users (protected route)
    app.get("/users", verifyJWT, async (req, res) => {
      try {
        const users = await usersCollection
          .find({}, { projection: { password: 0 } }) // hide password
          .toArray();

        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });

        // LOGIN
        app.post("/login", async (req, res) => {
            try {
                const { email, password } = req.body;
                console.log("Login attempt for:", email, "Password provided:", password ? "YES" : "NO");
                if (!email || !password) {
                    console.log("Login failed: Missing email or password");
                    return res.status(400).json({ message: "Email and password required" });
                }
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    console.log("Login failed: User not found for email:", email);
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    console.log("Login failed: Password mismatch for user:", email);
                    return res.status(400).json({ message: "Invalid credentials" });
                }
                // Convert ObjectId to string for JWT token
                const tokenPayload = {
                    email: user.email,
                    userRole: user.userRole,
                    id: user._id.toString(),
                    userId: user._id.toString() // Also include as userId for compatibility
                };
                const token = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5h" });
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: false,      // MUST be false on localhost
                    sameSite: "lax",    // important for dev
                    maxAge: 5 * 60 * 60 * 1000 // 5 hours
                });
                res.status(200).json({ token, user: { email: user.email, fullName: user.fullName, userRole: user.userRole } });
            } catch (error) {
                res.status(500).json({ message: "Login failed", error: error.message });
            }
        });


    // Get user role by email
    app.get("/users/role", verifyJWT, async (req, res) => {
      try {
        const { email } = req.query;
        if (!email)
          return res.status(400).json({ message: "Email is required" });

        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ role: user.userRole || "user" });
      } catch (error) {
        console.error(error); // log the actual error
        res
          .status(500)
          .json({ message: "Error fetching user role", error: error.message });
      }
    });

    // DELETE a user (protected route)
    app.delete("/users/:id", verifyJWT, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id))
          return res.status(400).json({ message: "Invalid user ID" });
        const result = await usersCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0)
          return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to delete user", error: error.message });
      }
    });

    // UPDATE user role (protected route)
    app.put("/users/role", verifyJWT, async (req, res) => {
      try {
        const { userId, role } = req.body;
        console.log(
          "Role change request - userId:",
          userId,
          "role:",
          role,
          "body:",
          req.body,
        );
        // Validate required fields
        if (!userId || !role) {
          const missing = [];
          if (!userId) missing.push("userId");
          if (!role) missing.push("role");
          return res.status(400).json({
            message: `Required fields are missing: ${missing.join(", ")}`,
          });
        }
        // Validate role value
        const validRoles = ["user", "doctor", "admin"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          });
        }
        // Validate userId format
        if (!ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { userRole: role } },
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        if (result.modifiedCount === 0) {
          return res
            .status(200)
            .json({ message: "Role unchanged (already set to this role)" });
        }
        const updatedUser = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        res
          .status(200)
          .json({ message: `Role updated to ${role}`, user: updatedUser });
      } catch (error) {
        console.error("Error updating user role:", error);
        res
          .status(500)
          .json({ message: "Failed to update role", error: error.message });
      }
    });

    // End User collection(APU) -----------------------------------------------------------------------


        // DOCTOR REQUEST ROUTES -----------------------------------------------------------------------

        // 1. Submit a request to become a doctor
        app.post("/api/user/request-doctor", verifyJWT, async (req, res) => {
            try {
                const userId = req.user.id;
                const { specialization, qualifications, experience, bio, consultationFee } = req.body;

                // Check if user already has a pending request
                const existingRequest = await doctorRequestsCollection.findOne({
                    userId: userId,
                    status: "pending"
                });

                if (existingRequest) {
                    return res.status(400).json({ message: "You already have a pending request." });
                }

                const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

                const newRequest = {
                    userId,
                    userName: user.fullName || user.name,
                    userEmail: user.email,
                    specialization,
                    qualifications,
                    experience,
                    bio,
                    consultationFee,
                    status: "pending",
                    createdAt: new Date()
                };

                const result = await doctorRequestsCollection.insertOne(newRequest);
                res.status(201).json({ message: "Request submitted successfully", requestId: result.insertedId });

            } catch (error) {
                console.error("Error submitting doctor request:", error);
                res.status(500).json({ message: "Failed to submit request", error: error.message });
            }
        });

        // 2. Check if user has a pending request
        app.get("/api/user/doctor-request-status", verifyJWT, async (req, res) => {
            try {
                const userId = req.user.userId || req.user.id;
                const request = await doctorRequestsCollection.findOne({
                    userId: userId,
                    status: "pending"
                });

                res.status(200).json({
                    hasPendingRequest: !!request,
                    request: request
                });
            } catch (error) {
                console.error("Error checking request status:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        });

        // 3. Admin: Get all doctor requests
        app.get("/api/admin/doctor-requests", verifyJWT, async (req, res) => {
            try {
                // Check admin role
                if (req.user.userRole !== 'admin') {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const requests = await doctorRequestsCollection.find({}).sort({ createdAt: -1 }).toArray();
                res.status(200).json(requests);
            } catch (error) {
                console.error("Error fetching doctor requests:", error);
                res.status(500).json({ message: "Failed to fetch requests", error: error.message });
            }
        });

        // 4. Admin: Approve/Reject Request
        app.put("/api/admin/doctor-requests/:id/status", verifyJWT, async (req, res) => {
            try {
                // Check admin role
                if (req.user.userRole !== 'admin') {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const requestId = req.params.id;
                const { status } = req.body; // 'approved' or 'rejected'

                if (!['approved', 'rejected'].includes(status)) {
                    return res.status(400).json({ message: "Invalid status" });
                }

                const request = await doctorRequestsCollection.findOne({ _id: new ObjectId(requestId) });
                if (!request) {
                    return res.status(404).json({ message: "Request not found" });
                }

                if (status === 'approved') {
                    // 1. Update User Role
                    await usersCollection.updateOne(
                        { _id: new ObjectId(request.userId) },
                        { $set: { userRole: 'doctor' } }
                    );

                    // 2. Add to doctorinfoCollection
                    const doctorInfo = {
                        userId: request.userId, // Link to user
                        fullName: request.userName,
                        email: request.userEmail,
                        specialization: request.specialization,
                        qualifications: request.qualifications,
                        experience: request.experience,
                        bio: request.bio,
                        consultationFee: request.consultationFee,
                        createdAt: new Date(),
                        // Add default availability or other fields if needed
                        availability: []
                    };

                    // Upsert to avoid duplicates if they already exist (though they shouldn't)
                    await doctorinfoCollection.updateOne(
                        { userId: request.userId },
                        { $set: doctorInfo },
                        { upsert: true }
                    );
                }

                // 3. Update Request Status
                await doctorRequestsCollection.updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { status: status, updatedAt: new Date() } }
                );

                res.status(200).json({ message: `Request ${status} successfully` });

            } catch (error) {
                console.error("Error updating request status:", error);
                res.status(500).json({ message: "Failed to update status", error: error.message });
            }
        });

        // ==============================Apu part End=============================================================================


    // User Profile based on role ---------------------------------------------------------------------
    // Get user profile
    app.get("/users/profile", verifyJWT, async (req, res) => {
      try {
        // Try to get userId from token (supports both id and userId fields)
        // Try to get userId from token (supports both id and userId fields)
        const userId = req.user.id || req.user.userId || req.user._id;
        const userEmail = req.user.email;

        console.log(
          "Fetching profile - userId from token:",
          userId,
          "email:",
          userEmail,
        );

        let userAccount;
        let userObjectId;

        // 1. Get the base user account (credentials + role)
        if (userId) {
          try {
            userObjectId =
              userId instanceof ObjectId ? userId : new ObjectId(userId);
            userAccount = await usersCollection.findOne({ _id: userObjectId });
          } catch (idError) {
            console.log(
              "Invalid userId format, trying email lookup:",
              idError.message,
            );
            if (userEmail) {
              userAccount = await usersCollection.findOne({ email: userEmail });
              if (userAccount) userObjectId = userAccount._id;
            }
          }
        } else if (userEmail) {
          userAccount = await usersCollection.findOne({ email: userEmail });
          if (userAccount) userObjectId = userAccount._id;
        }

        if (!userAccount) {
          return res.status(404).json({ message: "User not found" });
        }

        // 2. Based on role, fetch detailed profile info
        const userRole = userAccount.userRole || "user";
        let profileData = {};

        if (userRole === "doctor") {
          profileData = await doctorinfoCollection.findOne({
            userId: userObjectId,
          });
        } else {
          profileData = await userinfoCollection.findOne({
            userId: userObjectId,
          });
        }

        // 3. Merge and formatting
        const response = {
          _id: userAccount._id.toString(),
          email: userAccount.email || "",
          userRole: userRole,
          registrationDate: userAccount.registrationDate,

          // Profile fields
          fullName: profileData?.fullName || userAccount.fullName || "",
          gender: profileData?.gender || userAccount.gender || "",
          dob: profileData?.dob || userAccount.dob || "",
          phoneNumber: profileData?.phoneNumber || userAccount.phoneNumber || "",
          photoURL: profileData?.photoURL || "default-url",
          address: profileData?.address || userAccount.address || "",

          // Doctor specific
          specialization: profileData?.specialization || "",
          qualifications: profileData?.qualifications || "",
          experience: profileData?.experience || "",
          bio: profileData?.bio || "",
        };

        console.log(
          `Profile fetched successfully for ${userRole}:`,
          response.email,
        );
        res.status(200).json(response);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
          message: "Error fetching user profile",
          error: error.message,
        });
      }
    });

    // Get user profile by userId from URL
    app.get("/api/user/profile/:userId", verifyJWT, async (req, res) => {
      try {
        const { userId } = req.params;
        console.log("Fetching profile for userId (from URL):", userId);

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        let userObjectId;
        try {
          userObjectId = new ObjectId(userId);
        } catch (error) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }

        const userAccount = await usersCollection.findOne({
          _id: userObjectId,
        });

        if (!userAccount) {
          return res.status(404).json({ message: "User not found" });
        }

        // Fetch profile data based on role
        const userRole = userAccount.userRole || "user";
        let profileData = {};

        if (userRole === "doctor") {
          profileData = await doctorinfoCollection.findOne({
            userId: userObjectId,
          });
        } else {
          profileData = await userinfoCollection.findOne({
            userId: userObjectId,
          });
        }

        // Merge Response
        const response = {
          _id: userAccount._id.toString(),
          email: userAccount.email || "",
          userRole: userRole,
          registrationDate: userAccount.registrationDate,

          // Profile fields
          fullName: profileData?.fullName || userAccount.fullName || "",
          gender: profileData?.gender || userAccount.gender || "",
          dob: profileData?.dob || userAccount.dob || "",
          phoneNumber: profileData?.phoneNumber || userAccount.phoneNumber || "",
          photoURL: profileData?.photoURL || "default-url",
          address: profileData?.address || userAccount.address || "",

          // Doctor specific
          specialization: profileData?.specialization || "",
          qualifications: profileData?.qualifications || "",
          experience: profileData?.experience || "",
          bio: profileData?.bio || "",
        };

        res.status(200).json(response);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
          message: "Error fetching user profile",
          error: error.message,
        });
      }
    });

    // Get user by userId
    app.get("/api/user/:userId", verifyJWT, async (req, res) => {
      try {
        const { userId } = req.params;
        console.log("Fetching user for userId:", userId);

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        let userObjectId;
        try {
          userObjectId = new ObjectId(userId);
        } catch (error) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }

        const user = await usersCollection.findOne({ _id: userObjectId });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Return user data without password
        const { password, ...userData } = user;
        userData._id = userData._id.toString();

        const response = {
          _id: userData._id,
          fullName: userData.fullName || "",
          email: userData.email || "",
          dob: userData.dob || "",
          gender: userData.gender || "",
          photoURL: userData.photoURL || "default-url",
          userRole: userData.userRole || "user",
          specialization: userData.specialization || "",
          qualifications: userData.qualifications || "",
          experience: userData.experience || "",
          bio: userData.bio || "",
          registrationDate: userData.registrationDate,
          address: userData.address,
        };

        res.status(200).json(response);
      } catch (error) {
        console.error("Error fetching user:", error);
        res
          .status(500)
          .json({ message: "Error fetching user data", error: error.message });
      }
    });

    // Update user profile by userId from URL
    app.put(
      "/api/user/profile/:userId",
      verifyJWT,
      upload.single("profilePicture"),
      async (req, res) => {
        try {
          const { userId } = req.params;
          console.log("===UPDATE PROFILE ROUTE===");
          console.log("Updating profile for userId (from URL):", userId);
          console.log("Request method:", req.method);
          console.log("Request path:", req.path);

          if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
          }

          let userObjectId;
          try {
            userObjectId = new ObjectId(userId);
          } catch (error) {
            return res.status(400).json({ message: "Invalid user ID format" });
          }

          // Verify user exists and get role
          const userAccount = await usersCollection.findOne({
            _id: userObjectId,
          });
          if (!userAccount) {
            console.log(
              "ERROR: User not found in database for userId:",
              userId,
            );
            return res.status(404).json({ message: "User not found" });
          }

          const {
            fullName,
            phone,
            dob,
            gender,
            photoURL,
            specialization,
            qualifications,
            experience,
            bio,
            consultationFee,
            address,
          } = req.body;

          // Process fields
          const processField = (value, allowEmpty = false) => {
            if (value === undefined || value === null) return undefined;
            const str = String(value).trim();
            if (!allowEmpty && str === "") return undefined;
            return str;
          };

          const updateFields = { updatedAt: new Date() };

          // Common fields
          if (fullName !== undefined) {
            const processed = processField(fullName);
            if (processed !== undefined) updateFields.fullName = processed;
          }
          if (phone !== undefined) {
            updateFields.phoneNumber = processField(phone, true) || "";
          }
          if (dob !== undefined) {
            const processed = processField(dob);
            if (processed !== undefined) updateFields.dob = processed;
          }
          if (gender !== undefined) {
            const processed = processField(gender);
            if (processed !== undefined) updateFields.gender = processed;
          }
          if (address !== undefined) {
            const processed = processField(address);
            if (processed !== undefined) updateFields.address = processed;
          }

          // Handle profile picture
          if (req.file) {
            try {
              const fileBuffer = req.file.buffer;
              const base64Image = fileBuffer.toString("base64");
              const dataURL = `data:${req.file.mimetype};base64,${base64Image}`;
              updateFields.photoURL = dataURL;
              console.log("Profile picture uploaded");
            } catch (fileError) {
              console.error("Error processing file:", fileError);
            }
          } else if (photoURL !== undefined) {
            updateFields.photoURL = processField(photoURL, true) || "";
          }

          // Doctor specific fields
          const userRole = userAccount.userRole || "user";
          if (userRole === "doctor") {
            if (specialization !== undefined)
              updateFields.specialization =
                processField(specialization, true) || "";
            if (qualifications !== undefined)
              updateFields.qualifications =
                processField(qualifications, true) || "";
            if (experience !== undefined)
              updateFields.experience = processField(experience, true) || "";
            if (bio !== undefined)
              updateFields.bio = processField(bio, true) || "";
            if (consultationFee !== undefined)
              updateFields.consultationFee =
                processField(consultationFee, true) || "0";
          }

          if (Object.keys(updateFields).length <= 1) {
            // 1 because updatedAt
            return res
              .status(400)
              .json({ message: "No valid fields to update" });
          }

          // Update correct collection
          if (userRole === "doctor") {
            const updateDoc = {
              $set: updateFields,
              $setOnInsert: { userId: userObjectId, email: userAccount.email },
            };
            await doctorinfoCollection.updateOne(
              { userId: userObjectId },
              updateDoc,
              { upsert: true },
            );
          } else {
            const updateDoc = {
              $set: updateFields,
              $setOnInsert: { userId: userObjectId, email: userAccount.email },
            };
            await userinfoCollection.updateOne(
              { userId: userObjectId },
              updateDoc,
              { upsert: true },
            );
          }

          // Update fullName in usersCollection if changed (for legacy compatibility)
          if (updateFields.fullName) {
            await usersCollection.updateOne(
              { _id: userObjectId },
              { $set: { fullName: updateFields.fullName } },
            );
          }

          // Fetch fresh complete profile
          let freshProfile = {};
          if (userRole === "doctor") {
            freshProfile = await doctorinfoCollection.findOne({
              userId: userObjectId,
            });
          } else {
            freshProfile = await userinfoCollection.findOne({
              userId: userObjectId,
            });
          }

          const fullResponse = {
            _id: userAccount._id.toString(),
            email: userAccount.email || "",
            userRole: userRole,
            registrationDate: userAccount.registrationDate,

            fullName: freshProfile?.fullName || userAccount.fullName || "",
            gender: freshProfile?.gender || "",
            dob: freshProfile?.dob || "",
            phoneNumber: freshProfile?.phoneNumber || "",
            photoURL: freshProfile?.photoURL || "default-url",
            address: freshProfile?.address || "",

            // Doctor specific
            specialization: freshProfile?.specialization || "",
            qualifications: freshProfile?.qualifications || "",
            experience: freshProfile?.experience || "",
            bio: freshProfile?.bio || "",
          };

          console.log("Profile updated successfully for userId:", userId);
          res.status(200).json({
            message: "Profile updated successfully",
            user: fullResponse,
          });
        } catch (error) {
          console.error("Error updating profile:", error);
          console.error("Error message:", error.message);
          res.status(500).json({
            message: "Error updating profile",
            error: error.message,
          });
        }
      },
    );

    // Update user profile information
    app.put("/users/profile", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const userObjectId = new ObjectId(userId);
        const currentUser = await usersCollection.findOne({
          _id: userObjectId,
        });
        const {
          fullName,
          email,
          phoneNumber,
          dob,
          gender,
          specialization,
          qualifications,
          experience,
          bio,
          address,
        } = req.body;

        if (!userId) {
          return res
            .status(400)
            .json({ message: "User ID not found in token" });
        }

        const updateFields = {};
        if (fullName) updateFields.fullName = fullName;
        if (email) updateFields.email = email;
        if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
        if (dob) updateFields.dob = dob;
        if (gender) updateFields.gender = gender;
        if (address) updateFields.address = address;

        // Professional details for doctors
        if (specialization !== undefined)
          updateFields.specialization = specialization;
        if (qualifications !== undefined)
          updateFields.qualifications = qualifications;
        if (experience !== undefined) updateFields.experience = experience;
        if (bio !== undefined) updateFields.bio = bio;

        if (Object.keys(updateFields).length === 0) {
          return res.status(400).json({ message: "No valid fields to update" });
        }

        // Check if email is being updated and if it already exists
        if (email) {
          const existingUser = await usersCollection.findOne({
            email: email,
            _id: { $ne: new ObjectId(userId) },
          });
          if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
          }
        }

        updateFields.updatedAt = new Date();

        // Determine role and update profile collection
        const userRole = currentUser.userRole || "user";

        if (userRole === "doctor") {
          await doctorinfoCollection.updateOne(
            { userId: userObjectId },
            { $set: updateFields, $setOnInsert: { email: currentUser.email } },
            { upsert: true },
          );
        } else {
          await userinfoCollection.updateOne(
            { userId: userObjectId },
            { $set: updateFields, $setOnInsert: { email: currentUser.email } },
            { upsert: true },
          );
        }

        // Update fullName/email in usersCollection if changed
        if (updateFields.fullName || updateFields.email) {
          const usersUpdate = {};
          if (updateFields.fullName)
            usersUpdate.fullName = updateFields.fullName;
          if (updateFields.email) usersUpdate.email = updateFields.email;

          await usersCollection.updateOne(
            { _id: userObjectId },
            { $set: usersUpdate },
          );
        }

        // Fetch fresh profile
        let freshProfile = {};
        if (userRole === "doctor") {
          freshProfile = await doctorinfoCollection.findOne({
            userId: userObjectId,
          });
        } else {
          freshProfile = await userinfoCollection.findOne({
            userId: userObjectId,
          });
        }

        // Fetch fresh account (in case email changed)
        const freshAccount = await usersCollection.findOne({
          _id: userObjectId,
        });
        if (!freshAccount) {
          // Should theoretically not happen unless deleted concurrently
          return res
            .status(404)
            .json({ message: "User not found after update" });
        }

        const response = {
          _id: freshAccount._id.toString(),
          email: freshAccount.email || "",
          userRole: userRole,
          registrationDate: freshAccount.registrationDate,

          fullName: freshProfile?.fullName || freshAccount.fullName || "",
          gender: freshProfile?.gender || freshAccount.gender || "",
          dob: freshProfile?.dob || freshAccount.dob || "",
          phoneNumber: freshProfile?.phoneNumber || freshAccount.phoneNumber || "",
          photoURL: freshProfile?.photoURL || "default-url",
          address: freshProfile?.address || freshAccount.address || "",

          specialization: freshProfile?.specialization || "",
          qualifications: freshProfile?.qualifications || "",
          experience: freshProfile?.experience || "",
          bio: freshProfile?.bio || "",
        };

        res.status(200).json({
          message: "Profile updated successfully",
          user: response,
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res
          .status(500)
          .json({ message: "Error updating profile", error: error.message });
      }
    });

    // Update profile picture
    app.put("/users/profile/picture", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { photoURL } = req.body;

        if (!userId) {
          return res
            .status(400)
            .json({ message: "User ID not found in token" });
        }

        if (!photoURL) {
          return res
            .status(400)
            .json({ message: "Profile picture URL is required" });
        }

        const userObjectId = new ObjectId(userId);
        const currentUser = await usersCollection.findOne({
          _id: userObjectId,
        });
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const userRole = currentUser.userRole || "user";
        const updateDoc = {
          $set: { photoURL, updatedAt: new Date() },
          $setOnInsert: { email: currentUser.email },
        };

        if (userRole === "doctor") {
          await doctorinfoCollection.updateOne(
            { userId: userObjectId },
            updateDoc,
            { upsert: true },
          );
        } else {
          await userinfoCollection.updateOne(
            { userId: userObjectId },
            updateDoc,
            { upsert: true },
          );
        }

        // Fetch fresh profile
        let freshProfile = {};
        if (userRole === "doctor") {
          freshProfile = await doctorinfoCollection.findOne({
            userId: userObjectId,
          });
        } else {
          freshProfile = await userinfoCollection.findOne({
            userId: userObjectId,
          });
        }

        const response = {
          _id: currentUser._id.toString(),
          email: currentUser.email || "",
          userRole: userRole,
          registrationDate: currentUser.registrationDate,

          fullName: freshProfile?.fullName || currentUser.fullName || "",
          gender: freshProfile?.gender || currentUser.gender || "",
          dob: freshProfile?.dob || currentUser.dob || "",
          phoneNumber: freshProfile?.phoneNumber || currentUser.phoneNumber || "",
          photoURL: freshProfile?.photoURL || "default-url",
          address: freshProfile?.address || currentUser.address || "",

          specialization: freshProfile?.specialization || "",
          qualifications: freshProfile?.qualifications || "",
          experience: freshProfile?.experience || "",
          bio: freshProfile?.bio || "",
        };

        res.status(200).json({
          message: "Profile updated successfully",
          user: response,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error Uploading profile picture",
          error: error.message,
        });
      }
    });

    // Change password
    app.put("/users/change-password", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!userId) {
          return res
            .status(400)
            .json({ message: "User ID not found in token" });
        }

        if (!currentPassword || !newPassword || !confirmNewPassword) {
          return res.status(400).json({
            message:
              "Current password, new password, and confirm password are required",
          });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmNewPassword) {
          return res.status(400).json({
            message: "New password and confirm password do not match",
          });
        }

        // Get user from database
        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password,
        );
        if (!isCurrentPasswordValid) {
          return res
            .status(400)
            .json({ message: "Current password doesn't match" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { password: hashedNewPassword } },
        );

        if (result.modifiedCount === 0) {
          return res.status(500).json({ message: "Failed to update password" });
        }

        res.status(200).json({ message: "Password updated successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error changing password", error: error.message });
      }
    });

    // Change password by userId from URL
    app.put(
      "/api/user/change-password/:userId",
      verifyJWT,
      async (req, res) => {
        try {
          const { userId } = req.params;
          const { currentPassword, newPassword } = req.body; // Frontend only sends these two

          if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
          }

          if (!currentPassword || !newPassword) {
            return res.status(400).json({
              message: "Current password and new password are required",
            });
          }

          // Handle ObjectId conversion
          let userObjectId;
          try {
            userObjectId = new ObjectId(userId);
          } catch (error) {
            return res.status(400).json({ message: "Invalid user ID format" });
          }

          // Get user from database
          const user = await usersCollection.findOne({ _id: userObjectId });
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          // Verify current password
          const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
          );
          if (!isCurrentPasswordValid) {
            return res
              .status(400)
              .json({ message: "Current password doesn't match" });
          }

          // Hash new password
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);

          // Update password
          const result = await usersCollection.updateOne(
            { _id: userObjectId },
            { $set: { password: hashedNewPassword } },
          );

          if (result.modifiedCount === 0) {
            return res
              .status(500)
              .json({ message: "Failed to update password" });
          }

          res.status(200).json({
            success: true,
            message: "Password updated successfully",
          });
        } catch (error) {
          console.error("Error changing password:", error);
          res
            .status(500)
            .json({ message: "Error changing password", error: error.message });
        }
      },
    );

    app.get("/doctors", async (req, res) => {
      console.log("GET /doctors request received - applying robust fetch");
      try {
        // Fetch doctors and join with their profile info (reusing robost logic from /api/doctors)
        const doctors = await usersCollection
          .aggregate([
            { $match: { userRole: "doctor" } },
            {
              $lookup: {
                from: "doctorinfo",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$userId", "$$userId"] },
                          { $eq: ["$userId", { $toString: "$$userId" }] },
                        ],
                      },
                    },
                  },
                ],
                as: "profile",
              },
            },
            {
              $project: {
                password: 0,
                "profile.userId": 0,
                "profile._id": 0,
              },
            },
            {
              $addFields: {
                profile: { $arrayElemAt: ["$profile", 0] },
              },
            },
            {
              $addFields: {
                fullName: {
                  $ifNull: ["$fullName", "$profile.fullName", "Unknown Doctor"],
                },
                specialization: {
                  $ifNull: [
                    "$specialization",
                    "$profile.specialization",
                    "General",
                  ],
                },
                fee: { $ifNull: ["$fee", "$profile.consultationFee", "0"] },
                consultationFee: {
                  $ifNull: [
                    "$consultationFee",
                    "$profile.consultationFee",
                    "0",
                  ],
                },
              },
            },
          ])
          .toArray();
        console.log(`Found ${doctors.length} doctors via robust fetch`);
        res.status(200).json(doctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch doctors", error: error.message });
      }
    });

    // End User Profile based on role ---------------------------------------------------------------------

    // GET Admin Metrics -- Maliha
    app.get("/api/admin/metrics", verifyJWT, async (req, res) => {
      try {
        // Get user from token
        const userId = req.user.id || req.user.userId || req.user._id;
        const userEmail = req.user.email;

        // Verify user exists and is admin (check database, not just token)
        let user;
        if (userId) {
          try {
            const userObjectId =
              userId instanceof ObjectId ? userId : new ObjectId(userId);
            user = await usersCollection.findOne({ _id: userObjectId });
          } catch (idError) {
            if (userEmail) {
              user = await usersCollection.findOne({ email: userEmail });
            }
          }
        } else if (userEmail) {
          user = await usersCollection.findOne({ email: userEmail });
        }

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if user is admin
        if (user.userRole !== "admin") {
          return res
            .status(403)
            .json({ message: "Access denied. Admin privileges required." });
        }

        // Calculate metrics
        // Count doctors (users with role "doctor")
        const totalDoctors = await usersCollection.countDocuments({
          userRole: "doctor",
        });

        // Count patients (users with role "user")
        const totalPatients = await usersCollection.countDocuments({
          userRole: "user",
        });

        // Count all appointments
        const totalAppointments = await appointmentsCollection.countDocuments(
          {},
        );

        // Status values in the system: "Pending", "Confirmed", "Completed", "Cancelled"
        // Booked appointments = "Confirmed" status
        const bookedAppointments = await appointmentsCollection.countDocuments({
          status: { $in: ["Confirmed", "confirmed"] },
        });

                // Calculate total revenue from completed AND confirmed (paid) appointments
                const revenueQueryStatus = { $in: ["Completed", "completed", "Confirmed", "confirmed"] };

                const revenueAppts = await appointmentsCollection.find({
                    status: revenueQueryStatus
                }).toArray();

                console.log(`[DEBUG] Found ${revenueAppts.length} appointments for revenue (Confirmed + Completed)`);

                const totalRevenue = revenueAppts.reduce((sum, apt) => {
                    const fee = parseInt(apt.fee || apt.price || apt.amount || 0);
                    return sum + (isNaN(fee) ? 0 : fee);
                }, 0);
                console.log(`[DEBUG] Calculated Total Revenue: ${totalRevenue}`);

                // --- Revenue Chart Data ---

                // 1. Weekly Revenue (Last 7 Days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const weeklyData = await appointmentsCollection.aggregate([
                    {
                        $match: {
                            status: revenueQueryStatus,
                            appointmentDate: { $gte: sevenDaysAgo }
                        }
                    },
                    {
                        $project: {
                            dayOfWeek: { $dayOfWeek: "$appointmentDate" }, // 1 (Sun) - 7 (Sat)
                            revenue: {
                                $convert: {
                                    input: { $ifNull: ["$fee", { $ifNull: ["$price", { $ifNull: ["$amount", 0] }] }] },
                                    to: "int",
                                    onError: 0,
                                    onNull: 0
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$dayOfWeek",
                            totalRevenue: { $sum: "$revenue" }
                        }
                    }
                ]).toArray();

                // Format weekly data to ensure all days are present
                const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const revenueWeekly = daysOfWeek.map((day, index) => {
                    // query returns 1 for Sun, 2 for Mon... we map index 0 (Sun) to 1, etc.
                    const dayData = weeklyData.find(d => d._id === (index + 1));
                    return {
                        day,
                        revenue: dayData ? dayData.totalRevenue : 0
                    };
                });

                // Reorder to start from 6 days ago up to today
                const orderedWeeklyRevenue = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayName = daysOfWeek[d.getDay()];
                    const dayData = revenueWeekly.find(r => r.day === dayName);
                    orderedWeeklyRevenue.push(dayData);
                }


                // 2. Monthly Revenue (Current Year)
                const startOfYear = new Date(new Date().getFullYear(), 0, 1);

                const monthlyData = await appointmentsCollection.aggregate([
                    {
                        $match: {
                            status: revenueQueryStatus,
                            appointmentDate: { $gte: startOfYear }
                        }
                    },
                    {
                        $project: {
                            month: { $month: "$appointmentDate" }, // 1 (Jan) - 12 (Dec)
                            revenue: {
                                $convert: {
                                    input: { $ifNull: ["$fee", { $ifNull: ["$price", { $ifNull: ["$amount", 0] }] }] },
                                    to: "int",
                                    onError: 0,
                                    onNull: 0
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$month",
                            totalRevenue: { $sum: "$revenue" }
                        }
                    }
                ]).toArray();

                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const revenueMonthly = monthNames.map((month, index) => {
                    const monthData = monthlyData.find(m => m._id === (index + 1));
                    return {
                        month,
                        revenue: monthData ? monthData.totalRevenue : 0
                    };
                });

                const metrics = {
                    totalDoctors,
                    totalPatients,
                    totalAppointments,
                    bookedAppointments,
                    totalRevenue,
                    revenueChart: {
                        weekly: orderedWeeklyRevenue,
                        monthly: revenueMonthly
                    }
                };

        res.status(200).json(metrics);
      } catch (error) {
        console.error("Error fetching admin metrics:", error);
        res.status(500).json({
          message: "Error fetching admin metrics",
          error: error.message,
        });
      }
    });

    // Doctor Collection start ---------------------------------------------------------------------
    //get all doctor info
    app.get("/api/doctors", async (req, res) => {
      try {
        // Fetch doctors and join with their profile info
        const doctors = await usersCollection
          .aggregate([
            { $match: { userRole: "doctor" } },
            {
              $lookup: {
                from: "doctorinfo",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$userId", "$$userId"] },
                          { $eq: ["$userId", { $toString: "$$userId" }] },
                        ],
                      },
                    },
                  },
                ],
                as: "profile",
              },
            },
            {
              $project: {
                password: 0,
                "profile.userId": 0,
                "profile._id": 0,
              },
            },
            {
              $addFields: {
                profile: { $arrayElemAt: ["$profile", 0] },
              },
            },
            {
              $addFields: {
                specialization: {
                  $ifNull: ["$specialization", "$profile.specialization", ""],
                },
                fee: { $ifNull: ["$fee", "$profile.consultationFee", "0"] },
                consultationFee: {
                  $ifNull: [
                    "$consultationFee",
                    "$profile.consultationFee",
                    "0",
                  ],
                },
              },
            },
          ])
          .toArray();
        res.status(200).json(doctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch doctors", error: error.message });
      }
    });

    // Get single doctor info by ID
    app.get("/api/doctors/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid doctor ID" });
        }
        const doctor = await doctorinfoCollection.findOne({
          $or: [
            { _id: new ObjectId(id) },
            { userId: new ObjectId(id) },
            { userId: id },
          ],
        });
        if (!doctor) {
          return res.status(404).json({ message: "Doctor not found" });
        }
        res.status(200).json(doctor);
      } catch (error) {
        console.error("Error fetching doctor:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch doctor", error: error.message });
      }
    });

    // GET Doctor Dashboard Data (all data in one call)
    app.get("/doctor/dashboard", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id || req.user.userId || req.user._id;
        if (!userId) {
          return res
            .status(401)
            .json({ message: "User ID not found in token" });
        }
        const doctorId = userId.toString();

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get start and end of current week for stats
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

                // Fetch all data in parallel
                const [
                    todayAppointments,
                    upcomingAppointments,
                    emergencyAppointments,
                    patients,
                    schedules,
                    totalAppointments,
                    completedAppointments,
                    newPatients,
                    dailyAppointments
                ] = await Promise.all([
                    // Today's appointments
                    appointmentsCollection.find({
                        doctorId: doctorId,
                        appointmentDate: { $gte: today, $lt: tomorrow }
                    }).sort({ appointmentTime: 1 }).toArray(),

                    // Upcoming appointments
                    appointmentsCollection.find({
                        doctorId: doctorId,
                        appointmentDate: { $gte: tomorrow }
                    }).sort({ appointmentDate: 1, appointmentTime: 1 }).limit(10).toArray(),

                    // Emergency appointments for this doctor
                    EmergencyCollection.find({
                        doctorId: doctorId,
                        status: { $in: ["pending", "accepted"] }
                    }).toArray(),

          // Patients
          patientsCollection
            .find({ doctorId: doctorId })
            .sort({ lastVisit: -1 })
            .limit(20)
            .toArray(),

          // Schedules
          schedulesCollection
            .find({ doctorId: doctorId })
            .sort({ day: 1 })
            .toArray(),

          // Weekly stats - total appointments
          appointmentsCollection.countDocuments({
            doctorId: doctorId,
            appointmentDate: { $gte: startOfWeek, $lt: endOfWeek },
          }),

          // Weekly stats - completed appointments
          appointmentsCollection.countDocuments({
            doctorId: doctorId,
            appointmentDate: { $gte: startOfWeek, $lt: endOfWeek },
            status: "Completed",
          }),

          // Weekly stats - new patients
          patientsCollection.countDocuments({
            doctorId: doctorId,
            firstVisit: { $gte: startOfWeek, $lt: endOfWeek },
          }),

                    // Daily appointment counts
                    appointmentsCollection.aggregate([
                        {
                            $match: {
                                doctorId: doctorId,
                                appointmentDate: { $gte: startOfWeek, $lt: endOfWeek }
                            }
                        },
                        {
                            $group: {
                                _id: { $dayOfWeek: "$appointmentDate" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]).toArray()
                ]);

                // Populate names for appointments
                const allTodayPopulated = await populateAppointmentDetails(todayAppointments);
                const allUpcomingPopulated = await populateAppointmentDetails(upcomingAppointments);
                const allEmergencyPopulated = await populateAppointmentDetails(emergencyAppointments);

                // Helper to normalize emergency for doctor
                const normalizeEmergency = (emp) => ({
                    ...emp,
                    _id: emp._id.toString(),
                    id: emp._id.toString(),
                    date: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                    }) : "—",
                    time: emp.slotTime?.start || "ASAP",
                    type: "Emergency",
                    status: emp.status || "Pending",
                    consultationType: emp.meetingType || "online" // Emergency is usually online
                });

                const normalizedEmergencies = allEmergencyPopulated.map(normalizeEmergency);

                // Format today's appointments
                const formattedTodayAppointments = [
                    ...allTodayPopulated.map(apt => {
                        const consultationId = apt._id.toString();
                        const isPatientOnline = activeParticipants.has(consultationId) &&
                            activeParticipants.get(consultationId).has(apt.patientId?.toString());

                        return {
                            ...apt,
                            date: apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            }) : "—",
                            time: apt.appointmentTime || "",
                            _id: apt._id.toString(),
                            isParticipantOnline: isPatientOnline
                        };
                    }),
                    ...normalizedEmergencies.filter(e => {
                        const d = new Date(e.appointmentDate);
                        return d >= today && d < tomorrow;
                    }).map(emp => {
                        const isPatientOnline = activeParticipants.has(emp.id) &&
                            activeParticipants.get(emp.id).has(emp.patientId?.toString());
                        return { ...emp, isParticipantOnline: isPatientOnline };
                    })
                ].sort((a, b) => (a.time > b.time ? 1 : -1));

                // Format upcoming appointments
                const formattedUpcomingAppointments = [
                    ...allUpcomingPopulated.map(apt => {
                        const consultationId = apt._id.toString();
                        const isPatientOnline = activeParticipants.has(consultationId) &&
                            activeParticipants.get(consultationId).has(apt.patientId?.toString());
                        return {
                            ...apt,
                            date: apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            }) : "—",
                            time: apt.appointmentTime || "",
                            _id: apt._id.toString(),
                            isParticipantOnline: isPatientOnline
                        };
                    }),
                    ...normalizedEmergencies.filter(e => new Date(e.appointmentDate) >= tomorrow).map(emp => {
                        const isPatientOnline = activeParticipants.has(emp.id) &&
                            activeParticipants.get(emp.id).has(emp.patientId?.toString());
                        return { ...emp, isParticipantOnline: isPatientOnline };
                    })
                ].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

        // Format patients
        const formattedPatients = patients.map((patient) => ({
          ...patient,
          name: patient.name || patient.patientName || "Unknown",
          condition: patient.condition || patient.primaryConcern || "N/A",
          lastVisit: patient.lastVisit
            ? new Date(patient.lastVisit).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "—",
          nextVisit: patient.nextVisit
            ? new Date(patient.nextVisit).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "—",
          _id: patient._id.toString(),
        }));

        // Format schedules
        const formattedSchedules = schedules.map((schedule) => ({
          ...schedule,
          _id: schedule._id.toString(),
        }));

        // Format daily appointments for stats
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const formattedDaily = days.map((day, index) => {
          const dayData = dailyAppointments.find((d) => d._id === index + 1);
          return { day, count: dayData ? dayData.count : 0 };
        });

                // Calculate revenue using actual total amounts from transactions
                const revenueData = await transactionsCollection.aggregate([
                    {
                        $match: {
                            userId: doctorId, // Note: transactions store userId for the doctor if they are the receiver? 
                            // Actually, let's check transaction structure. It stores appointmentId.
                            // Better way: get all completed appointment amounts.
                        }
                    }
                ]).toArray();

                // Simple fallback: count completed appointments * consultantFee from doctor profile
                const doctorProfile = await doctorinfoCollection.findOne({ userId: doctorId });
                const fee = parseInt(doctorProfile?.consultationFee) || 1500;
                const revenue = completedAppointments * fee;

        // Return all dashboard data
        res.status(200).json({
          todayAppointments: formattedTodayAppointments,
          upcomingAppointments: formattedUpcomingAppointments,
          patients: formattedPatients,
          scheduleSlots: formattedSchedules,
          weeklyStats: {
            totalAppointments,
            completedAppointments,
            newPatients,
            revenue: `৳${revenue.toLocaleString()}`,
            dailyAppointments: formattedDaily,
          },
        });
      } catch (error) {
        console.error("Error fetching doctor dashboard data:", error);
        res.status(500).json({
          message: "Error fetching dashboard data",
          error: error.message,
        });
      }
    });

    // GET Patient Dashboard Data
    app.get("/patient/dashboard", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id || req.user.userId || req.user._id;
        if (!userId) {
          return res
            .status(401)
            .json({ message: "User ID not found in token" });
        }
        const patientId = userId.toString();
        // Emergency collection uses ObjectId for patientId
        const patientObjectId = new ObjectId(userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

                const [upcomingAppointments, pastAppointments, emergencyAppointments, userTransactions] = await Promise.all([
                    // Upcoming (future or today, not cancelled)
                    appointmentsCollection.find({
                        patientId: patientId,
                        status: { $ne: "Cancelled" },
                        appointmentDate: { $gte: today }
                    }).sort({ appointmentDate: 1, appointmentTime: 1 }).toArray(),

            // Past (before today OR completed)
            appointmentsCollection
              .find({
                patientId: patientId,
                $or: [
                  { appointmentDate: { $lt: today } },
                  { status: "Completed" },
                  { status: "Cancelled" },
                ],
              })
              .sort({ appointmentDate: -1, appointmentTime: -1 })
              .toArray(),

                    // Fetch all emergencies for this patient
                    EmergencyCollection.find({ patientId: patientObjectId }).sort({ createdAt: -1 }).toArray(),

                    // Fetch transactions to find missing payment IDs
                    transactionsCollection.find({ userId: patientId }).toArray()
                ]);

                // Create a map of appointmentId -> transactionId
                const transactionMap = userTransactions.reduce((acc, txn) => {
                    acc[txn.appointmentId] = txn.transactionId;
                    return acc;
                }, {});

                // Normalize regular appointments with online status
                const formatWithOnlineStatus = (apt) => {
                    const consultationId = apt._id.toString();
                    const isDoctorOnline = activeParticipants.has(consultationId) &&
                        activeParticipants.get(consultationId).has(apt.doctorId?.toString());
                    return {
                        ...apt,
                        id: apt._id.toString(),
                        paymentId: apt.paymentId || transactionMap[apt._id.toString()] || null,
                        isParticipantOnline: isDoctorOnline
                    };
                };

                const upcomingPopulated = (await populateAppointmentDetails(upcomingAppointments)).map(formatWithOnlineStatus);
                const pastPopulated = await populateAppointmentDetails(pastAppointments);
                const emergencyPopulated = await populateAppointmentDetails(emergencyAppointments);

                // Normalize Emergency Appointments
                const normalizedEmergencies = emergencyPopulated.map(emp => {
                    const status = emp.status || "pending";
                    const isDoctorOnline = activeParticipants.has(emp._id.toString()) &&
                        activeParticipants.get(emp._id.toString()).has(emp.doctorId?.toString());
                    return {
                        _id: emp._id,
                        id: emp._id.toString(),
                        doctorName: emp.doctorName || "Emergency Doctor",
                        patientName: emp.patientName || "Unknown Patient",
                        specialization: "Emergency",
                        appointmentDate: emp.createdAt,
                        isParticipantOnline: isDoctorOnline,
                        appointmentTime: emp.slotTime?.start || "ASAP",
                        status: status,
                        type: "Emergency",
                        consultationType: emp.meetingType || "physical",
                        paymentStatus: emp.paymentStatus || "unpaid",
                        paymentId: emp.paymentId || transactionMap[emp._id.toString()] || null,
                        amount: emp.fee || emp.amount || 0,
                        doctorId: emp.doctorId,
                        patientId: emp.patientId
                    };
                });

        // Separate Emergencies
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const upcomingEmergencies = normalizedEmergencies.filter(
          (e) => e.status === "pending" || e.status === "accepted",
        );
        // If it's very old pending, maybe move to past? For now, keep as upcoming if pending.

        const pastEmergencies = normalizedEmergencies.filter(
          (e) => !upcomingEmergencies.includes(e),
        );

                // Helper to format regular appointment
                const formatRegular = (apt) => ({
                    ...apt,
                    id: apt._id.toString(),
                    type: "Regular",
                    paymentId: apt.paymentId || transactionMap[apt._id.toString()] || null,
                    paymentStatus: apt.paymentStatus || "Pending",
                    status: apt.status || "upcoming"
                });

                const formattedUpcoming = [
                    ...upcomingPopulated.map(formatRegular),
                    ...upcomingEmergencies
                ].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

                const formattedPast = [
                    ...pastPopulated.map(formatRegular), // Corrected map
                    ...pastEmergencies
                ].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

                // Helper for map below
                const formatPastRegular = (apt) => ({
                    ...apt,
                    id: apt._id.toString(),
                    type: "Regular",
                    paymentId: apt.paymentId || transactionMap[apt._id.toString()] || null,
                    paymentStatus: apt.paymentStatus || (apt.status === "Completed" ? "Paid" : "Pending"),
                    status: apt.status || "completed"
                });

                // Re-do formattedPast correctly with map
                const finalFormattedPast = [
                    ...pastPopulated.map(formatPastRegular),
                    ...pastEmergencies
                ].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));


        // Calculate Metrics
        const totalConsultations =
          finalFormattedPast.length + formattedUpcoming.length;
        const bookedConsultations = formattedUpcoming.length;

        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        const upcomingThisWeek = formattedUpcoming.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= today && aptDate <= weekFromNow;
        }).length;

                // specific fields for history view
                const formattedHistory = finalFormattedPast.filter(apt => apt.status === "Completed" || apt.status === "completed").map(apt => ({
                    ...apt,
                    consultationId: apt.id,
                    doctorSpecialization: apt.specialization || "General"
                }));

                // Separate into today and upcoming
                const todayFormatted = [];
                const futureFormatted = [];

                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                formattedUpcoming.forEach(apt => {
                    const aptDate = new Date(apt.appointmentDate);
                    if (aptDate >= today && aptDate < tomorrow) {
                        todayFormatted.push(apt);
                    } else if (aptDate >= tomorrow) {
                        futureFormatted.push(apt);
                    }
                });

                res.status(200).json({
                    metrics: {
                        totalConsultations,
                        bookedConsultations,
                        upcomingThisWeek
                    },
                    todayAppointments: todayFormatted,
                    upcomingAppointments: futureFormatted,
                    pastAppointments: finalFormattedPast,
                    history: formattedHistory
                });

            } catch (error) {
                console.error("Error fetching patient dashboard:", error);
                res.status(500).json({ message: "Failed to fetch dashboard data" });
            }
        });

    // ============ APPOINTMENTS APIs ============
    // GET Today's Appointments for Doctor
    app.get("/doctor/appointments/today", verifyJWT, async (req, res) => {
      try {
        const doctorId = req.user.id.toString();

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await appointmentsCollection
          .find({
            doctorId: doctorId,
            appointmentDate: { $gte: today, $lt: tomorrow },
          })
          .sort({ appointmentTime: 1 })
          .toArray();

        // Format appointments with formatted date/time
        const formattedAppointments = appointments.map((apt) => ({
          ...apt,
          date: apt.appointmentDate
            ? new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "—",
          time: apt.appointmentTime || "",
          _id: apt._id.toString(),
        }));

                res.status(200).json(formattedAppointments);
            } catch (error) {
                res.status(500).json({ message: "Error fetching upcoming appointments", error: error.message });
            }
        });

        // GET Single Appointment Details
        app.get("/api/appointments/:id", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid appointment ID" });
                }

                let appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
                if (!appointment) {
                    appointment = await EmergencyCollection.findOne({ _id: new ObjectId(id) });
                }

                if (!appointment) {
                    return res.status(404).json({ message: "Appointment not found" });
                }

                const populated = await populateAppointmentDetails([appointment]);
                res.status(200).json(populated[0]);
            } catch (error) {
                console.error("Error fetching appointment details:", error);
                res.status(500).json({ message: "Error fetching appointment details", error: error.message });
            }
        });

    // UPDATE Appointment Status
    app.patch(
      "/doctor/appointments/:id/status",
      verifyJWT,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { status } = req.body;
          const doctorId = req.user.id;

          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid appointment ID" });
          }

          const validStatuses = [
            "pending",
            "confirmed",
            "completed",
            "cancelled",
          ];
          if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
          }

          const result = await appointmentsCollection.updateOne(
            { _id: new ObjectId(id), doctorId: doctorId.toString() },
            { $set: { status, updatedAt: new Date() } },
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Appointment not found" });
          }

                res.status(200).json({ message: "Appointment status updated successfully" });
            } catch (error) {
                res.status(500).json({ message: "Error updating appointment", error: error.message });
            }
        });

        // ADD Prescription
        app.post("/doctor/appointments/:id/prescription", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const { medicine, dosage, instructions } = req.body;
                const doctorId = req.user.id;

                console.log(`[PRESCRIPTION] Attempting to save prescription for appointment ${id} by doctor ${doctorId}`);
                console.log(`[PRESCRIPTION] Data: medicine=${medicine}, dosage=${dosage}`);

                if (!ObjectId.isValid(id)) {
                    console.log(`[PRESCRIPTION] Invalid appointment ID: ${id}`);
                    return res.status(400).json({ message: "Invalid appointment ID" });
                }

                // Try to find in regular appointments first
                let appointment = await appointmentsCollection.findOne({
                    _id: new ObjectId(id),
                    doctorId: doctorId.toString()
                });

                let collectionToUpdate = appointmentsCollection;
                let isEmergency = false;

                // If not found, try emergency collection
                if (!appointment) {
                    console.log(`[PRESCRIPTION] Not found in appointments, checking emergency collection`);
                    appointment = await EmergencyCollection.findOne({
                        _id: new ObjectId(id),
                        doctorId: doctorId.toString()
                    });
                    if (appointment) {
                        collectionToUpdate = EmergencyCollection;
                        isEmergency = true;
                    }
                }

                if (!appointment) {
                    console.log(`[PRESCRIPTION] Appointment not found in either collection for ID ${id} and doctor ${doctorId}`);
                    return res.status(404).json({ message: "Appointment not found or unauthorized" });
                }

                console.log(`[PRESCRIPTION] Appointment found: ${appointment._id} (Emergency: ${isEmergency})`);

                // Get doctor info
                const doctorInfo = await doctorinfoCollection.findOne({
                    $or: [
                        { _id: new ObjectId(doctorId) },
                        { userId: doctorId },
                        { userId: new ObjectId(doctorId) }
                    ]
                });

                const prescriptionData = {
                    medicine,
                    dosage,
                    instructions,
                    createdAt: new Date()
                };

                // 1. Update appointment/emergency document with prescription
                await collectionToUpdate.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            prescription: prescriptionData,
                            updatedAt: new Date()
                        }
                    }
                );

                // 2. Save to prescriptions collection for patient profile
                const prescriptionDoc = {
                    appointmentId: id,
                    patientId: appointment.patientId || appointment.userId, // Handle different field names
                    doctorId: doctorId.toString(),
                    doctorName: doctorInfo?.fullName || appointment.doctorName || "Doctor",
                    specialization: doctorInfo?.specialization || appointment.specialization || "General",
                    medicine,
                    dosage,
                    instructions,
                    prescriptionDate: new Date(),
                    appointmentDate: appointment.appointmentDate || new Date()
                };

                console.log(`[PRESCRIPTION] Saving to prescriptions collection:`, prescriptionDoc);
                await prescriptionsCollection.insertOne(prescriptionDoc);

                console.log(`[PRESCRIPTION] Successfully saved prescription`);
                res.status(200).json({ message: "Prescription added successfully" });
            } catch (error) {
                console.error("[PRESCRIPTION] Error adding prescription:", error);
                res.status(500).json({ message: "Error adding prescription", error: error.message });
            }
        });

        // GET all prescriptions for a patient (for suggested prescriptions in profile)
        app.get("/api/patient/prescriptions", verifyJWT, async (req, res) => {
            try {
                const userId = req.user.id || req.user.userId;
                if (!userId) return res.status(401).json({ message: "Unauthorized" });

                const patientId = userId.toString();
                console.log(`[GET_PRESCRIPTIONS] Fetching for patient: ${patientId}`);

                // Fetch prescriptions directly from prescriptions collection
                // Search for both string ID and ObjectId to cover all bases
                const prescriptions = await prescriptionsCollection
                    .find({
                        $or: [
                            { patientId: patientId },
                            { patientId: new ObjectId(patientId) },
                            { userId: patientId }, // Backwards compatibility if saved as userId
                            { userId: new ObjectId(patientId) }
                        ]
                    })
                    .sort({ prescriptionDate: -1 })
                    .toArray();

                console.log(`[GET_PRESCRIPTIONS] Found ${prescriptions.length} records`);

                // Format the response
                const formattedPrescriptions = prescriptions.map((presc) => ({
                    appointmentId: presc.appointmentId,
                    doctorName: presc.doctorName,
                    doctorSpecialization: presc.specialization,
                    date: presc.prescriptionDate,
                    prescription: {
                        medicine: presc.medicine,
                        dosage: presc.dosage,
                        instructions: presc.instructions,
                        createdAt: presc.prescriptionDate
                    }
                }));

                res.status(200).json(formattedPrescriptions);
            } catch (error) {
                console.error("Error fetching patient prescriptions:", error);
                res.status(500).json({ message: "Error fetching prescriptions", error: error.message });
            }
        });

        // GET Prescription PDF (Download)
        app.get("/patient/appointments/:id/prescription/download", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid appointment ID" });

                const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
                if (!appointment || !appointment.prescription) {
                    return res.status(404).json({ message: "Prescription not found" });
                }

                // Check access (patient or doctor)
                const userId = req.user.id;
                if (appointment.patientId !== userId && appointment.doctorId !== userId && req.user.userRole !== 'admin') {
                    // console.log("Unauthorized PDF access:", userId);
                    // return res.status(403).json({ message: "Unauthorized" });
                }

                const doc = new PDFDocument();
                const filename = `Prescription_${appointment.patientName || 'Patient'}_${Date.now()}.pdf`;

                res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-type', 'application/pdf');

                doc.pipe(res);

                // PDF Content
                doc.fontSize(25).text('MediAI Prescription', { align: 'center' });
                doc.moveDown();

                doc.fontSize(12).text(`Date: ${new Date(appointment.prescription.createdAt).toLocaleDateString()}`, { align: 'right' });
                doc.moveDown();

                doc.fontSize(14).text(`Doctor: ${appointment.doctorName || 'N/A'}`);
                doc.text(`Patient: ${appointment.patientName || 'N/A'}`);
                doc.moveDown();
                doc.text('-----------------------------------------------------------');
                doc.moveDown();

                doc.fontSize(16).font('Helvetica-Bold').text('Rx');
                doc.moveDown(0.5);

                doc.fontSize(14).font('Helvetica').text(`Medicine: ${appointment.prescription.medicine}`);
                doc.text(`Dosage: ${appointment.prescription.dosage}`);

                if (appointment.prescription.instructions) {
                    doc.moveDown(0.5);
                    doc.text(`Instructions: ${appointment.prescription.instructions}`);
                }

                doc.moveDown(2);
                doc.fontSize(10).text('This is a computer-generated prescription.', { align: 'center', color: 'grey' });

                doc.end();

            } catch (error) {
                console.error("Error generating PDF:", error);
                res.status(500).json({ message: "Error generating PDF" });
            }
        });

    // GET Weekly Statistics for Doctor
    app.get("/doctor/appointments/stats", verifyJWT, async (req, res) => {
      try {
        const doctorId = req.user.id.toString();

        // Get start and end of current week
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        // Total appointments this week
        const totalAppointments = await appointmentsCollection.countDocuments({
          doctorId: doctorId,
          appointmentDate: { $gte: startOfWeek, $lt: endOfWeek },
        });

        // Completed appointments
        const completedAppointments =
          await appointmentsCollection.countDocuments({
            doctorId: doctorId,
            appointmentDate: { $gte: startOfWeek, $lt: endOfWeek },
            status: "Completed",
          });

        // New patients this week
        const newPatients = await patientsCollection.countDocuments({
          doctorId: doctorId,
          firstVisit: { $gte: startOfWeek, $lt: endOfWeek },
        });

        // Daily appointment counts
        const dailyAppointments = await appointmentsCollection
          .aggregate([
            {
              $match: {
                doctorId: doctorId,
                appointmentDate: { $gte: startOfWeek, $lt: endOfWeek },
              },
            },
            {
              $group: {
                _id: { $dayOfWeek: "$appointmentDate" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        // Format daily data
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const formattedDaily = days.map((day, index) => {
          const dayData = dailyAppointments.find((d) => d._id === index + 1);
          return { day, count: dayData ? dayData.count : 0 };
        });

        // Calculate revenue (assuming each appointment = 1500 BDT)
        const revenue = completedAppointments * 1500;

                res.status(200).json({
                    totalAppointments,
                    completedAppointments,
                    newPatients,
                    revenue: `৳${revenue.toLocaleString()}`,
                    dailyAppointments: formattedDaily
                });
            } catch (error) {
                res.status(500).json({ message: "Error fetching statistics", error: error.message });
            }
        });
        // End Doctor Collection ---------------------------------------------------------------------

        // ============ FAVORITES APIs ============

        // ADD to Favorites
        app.post("/api/favorites/add", verifyJWT, async (req, res) => {
            try {
                const { doctorId } = req.body;
                const patientId = req.user.id.toString();

                if (!doctorId) {
                    return res.status(400).json({ message: "Doctor ID is required" });
                }

                // Add doctor to patient's favorites list (avoid duplicates)
                await userinfoCollection.updateOne(
                    { userId: patientId },
                    { $addToSet: { favoriteDoctors: doctorId } },
                    { upsert: true }
                );

                res.status(200).json({ message: "Added to favorites" });
            } catch (error) {
                console.error("Error adding to favorites:", error);
                res.status(500).json({ message: "Failed to add to favorites", error: error.message });
            }
        });

        // REMOVE from Favorites
        app.delete("/api/favorites/remove", verifyJWT, async (req, res) => {
            try {
                const { doctorId } = req.body;
                const patientId = req.user.id.toString();

                if (!doctorId) {
                    return res.status(400).json({ message: "Doctor ID is required" });
                }

                // Remove doctor from patient's favorites list
                await userinfoCollection.updateOne(
                    { userId: patientId },
                    { $pull: { favoriteDoctors: doctorId } }
                );

                res.status(200).json({ message: "Removed from favorites" });
            } catch (error) {
                console.error("Error removing from favorites:", error);
                res.status(500).json({ message: "Failed to remove from favorites", error: error.message });
            }
        });

        // GET Favorites
        app.get("/api/favorites", verifyJWT, async (req, res) => {
            try {
                const patientId = req.user.id.toString();

                // Get patient's favorite doctor IDs
                const patientInfo = await userinfoCollection.findOne({ userId: patientId });
                const favoriteDoctorIds = patientInfo?.favoriteDoctors || [];

                if (favoriteDoctorIds.length === 0) {
                    return res.status(200).json([]);
                }

                // Fetch full doctor details
                const doctors = await doctorinfoCollection.find({
                    $or: [
                        { _id: { $in: favoriteDoctorIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : null).filter(Boolean) } },
                        { userId: { $in: favoriteDoctorIds } }
                    ]
                }).toArray();

                res.status(200).json(doctors);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                res.status(500).json({ message: "Failed to fetch favorites", error: error.message });
            }
        });

        // ============ RATINGS APIs ============

        // ADD Rating
        app.post("/api/ratings/add", verifyJWT, async (req, res) => {
            try {
                const { doctorId, rating, review } = req.body;
                const patientId = req.user.id.toString();

                if (!doctorId || !rating) {
                    return res.status(400).json({ message: "Doctor ID and rating are required" });
                }

                if (rating < 1 || rating > 5) {
                    return res.status(400).json({ message: "Rating must be between 1 and 5" });
                }

                // Get patient name
                const patient = await usersCollection.findOne({ _id: new ObjectId(patientId) });
                const patientName = patient?.fullName || patient?.name || "Anonymous";

                // Create rating document
                const ratingDoc = {
                    doctorId,
                    patientId,
                    patientName,
                    rating: parseInt(rating),
                    review: review || "",
                    createdAt: new Date()
                };

                await ratingsCollection.insertOne(ratingDoc);

                // Update doctor's average rating
                const allRatings = await ratingsCollection.find({ doctorId }).toArray();
                const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
                const ratingCount = allRatings.length;

                // Update doctor info with new average
                await doctorinfoCollection.updateMany(
                    {
                        $or: [
                            { _id: ObjectId.isValid(doctorId) ? new ObjectId(doctorId) : null },
                            { userId: doctorId }
                        ]
                    },
                    {
                        $set: {
                            ratingAvg: Math.round(avgRating * 10) / 10,
                            ratingCount: ratingCount
                        }
                    }
                );

                res.status(200).json({ message: "Rating submitted successfully" });
            } catch (error) {
                console.error("Error adding rating:", error);
                res.status(500).json({ message: "Failed to add rating", error: error.message });
            }
        });

        // GET Ratings for a Doctor
        app.get("/api/ratings/:doctorId", async (req, res) => {
            try {
                const { doctorId } = req.params;

                const ratings = await ratingsCollection
                    .find({ doctorId })
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).json(ratings);
            } catch (error) {
                console.error("Error fetching ratings:", error);
                res.status(500).json({ message: "Failed to fetch ratings", error: error.message });
            }
        });

        // ============ REPORTS APIs ============

        // ADD Report
        app.post("/api/reports/add", verifyJWT, async (req, res) => {
            try {
                const { doctorId, reason, description } = req.body;
                const patientId = req.user.id.toString();

                if (!doctorId || !reason || !description) {
                    return res.status(400).json({ message: "Doctor ID, reason, and description are required" });
                }

                // Create report document
                const reportDoc = {
                    doctorId,
                    patientId,
                    reason,
                    description,
                    status: "pending",
                    createdAt: new Date()
                };

                await reportsCollection.insertOne(reportDoc);

                // Flag doctor as "Under Review"
                await doctorinfoCollection.updateOne(
                    {
                        $or: [
                            { _id: ObjectId.isValid(doctorId) ? new ObjectId(doctorId) : null },
                            { userId: doctorId }
                        ]
                    },
                    { $set: { accountStatus: "Under Review" } }
                );

                res.status(200).json({ message: "Report submitted. Doctor profile flagged for review." });
            } catch (error) {
                console.error("Error adding report:", error);
                res.status(500).json({ message: "Failed to submit report", error: error.message });
            }
        });

        // RESOLVE/IGNORE Report
        app.put("/api/reports/:id/resolve", verifyJWT, async (req, res) => {
            try {
                // Admin only
                const adminId = req.user.id;
                const admin = await usersCollection.findOne({ _id: new ObjectId(adminId) });
                if (admin?.role !== "admin" && admin?.userRole !== "admin") {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const reportId = req.params.id;
                const { status } = req.body; // e.g., "Resolved", "Ignored"

                if (!["Resolved", "Ignored"].includes(status)) {
                    return res.status(400).json({ message: "Invalid status" });
                }

                const result = await reportsCollection.updateOne(
                    { _id: new ObjectId(reportId) },
                    { $set: { status: status, updatedAt: new Date() } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "Report not found" });
                }

                res.status(200).json({ message: `Report marked as ${status}` });
            } catch (error) {
                console.error("Error resolving report:", error);
                res.status(500).json({ message: "Failed to update report", error: error.message });
            }
        });

        // BAN Doctor
        app.put("/api/doctors/:id/ban", verifyJWT, async (req, res) => {
            try {
                // Admin only
                const adminId = req.user.id;
                const admin = await usersCollection.findOne({ _id: new ObjectId(adminId) });
                if (admin?.role !== "admin" && admin?.userRole !== "admin") {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const doctorId = req.params.id; // This could be userId or doctorId. Assuming userId for now as per other endpoints

                let userObjectId;
                try {
                    userObjectId = new ObjectId(doctorId);
                } catch (e) {
                    return res.status(400).json({ message: "Invalid doctor ID" });
                }

                // Update doctorinfo acountStatus
                // Convert userId to what is in doctorinfo (usually it has userId field)
                // But wait, doctorId param might be the _id of doctorInfo OR userId. 
                // Let's assume it matches how other endpoints work. 
                // Looking at GET /api/user/:userId, it expects userId (from usersCollection).

                await doctorinfoCollection.updateOne(
                    { userId: userObjectId },
                    { $set: { accountStatus: "Banned" } }
                );

                // Also could update usersCollection if we had a status there, but it seems mainly in doctorinfo.

                // Resolve all pending reports for this doctor?
                // Optional but good for cleanup. 
                // We need to find the doctorId (likely the string version or ObjectId) used in reports
                // Reports use 'doctorId' which seems to be the ID from the card... likely the doctorInfo._id or user._id.
                // In /api/reports/add: const { doctorId ... } = req.body.
                // It searches doctorInfo by _id: doctorId OR userId: doctorId.

                // Let's mark reports as Resolved (Banned)
                await reportsCollection.updateMany(
                    { doctorId: doctorId },
                    { $set: { status: "Resolved", resolution: "Doctor Banned" } }
                );

                res.status(200).json({ message: "Doctor has been banned" });

            } catch (error) {
                console.error("Error banning doctor:", error);
                res.status(500).json({ message: "Failed to ban doctor", error: error.message });
            }
        });

        // DELETE Doctor
        app.delete("/api/doctors/:id", verifyJWT, async (req, res) => {
            try {
                // Admin only
                const adminId = req.user.id;
                const admin = await usersCollection.findOne({ _id: new ObjectId(adminId) });
                if (admin?.role !== "admin" && admin?.userRole !== "admin") {
                    return res.status(403).json({ message: "Admin access required" });
                }

                const targetId = req.params.id;
                const targetObjectId = new ObjectId(targetId);

                // 1. Delete from usersCollection
                const userDeleteResult = await usersCollection.deleteOne({ _id: targetObjectId });

                if (userDeleteResult.deletedCount === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                // 2. Delete from doctorinfoCollection
                await doctorinfoCollection.deleteOne({ userId: targetObjectId });

                // 3. Delete from userinfoCollection (just in case)
                await userinfoCollection.deleteOne({ userId: targetObjectId });

                // 4. Delete appointments where this doctor is involved?
                // Appointments have doctorId. Is it userId or doctorInfo _id?
                // Historically it seems mixed. Let's try to delete by doctorId matching the string version of userId
                await appointmentsCollection.deleteMany({ doctorId: targetId });

                // 5. Delete schedules
                await schedulesCollection.deleteMany({ doctorId: targetId });

                // 6. Update reports?
                // Maybe mark them resolved?
                await reportsCollection.updateMany(
                    { doctorId: targetId },
                    { $set: { status: "Resolved", resolution: "Doctor Deleted" } }
                );

                res.status(200).json({ message: "Doctor profile and related data permanently deleted" });

            } catch (error) {
                console.error("Error deleting doctor:", error);
                res.status(500).json({ message: "Failed to delete doctor", error: error.message });
            }
        });

        // GET All Reports (Admin only)
        app.get("/api/reports", verifyJWT, async (req, res) => {
            console.log("GET /api/reports hit by user:", req.user.id);
            try {
                // Check if user is admin
                const userId = req.user.id;
                const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

                if (user?.role !== "admin" && user?.userRole !== "admin") {
                    console.log("Access denied. User role:", user?.role, "userRole:", user?.userRole);
                    return res.status(403).json({ message: "Admin access required" });
                }
                console.log("User is admin. Fetching reports...");

                const reports = await reportsCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();

                console.log(`[DEBUG] Reports found in DB: ${reports.length}`);

                const enrichedReports = await Promise.all(reports.map(async (report) => {
                    // Fetch doctor info
                    let doctor = null;
                    try {
                        const doctorIdObj = ObjectId.isValid(report.doctorId) ? new ObjectId(report.doctorId) : null;
                        console.log(`[DEBUG] Looking up doctor for report ${report._id}. ID: ${report.doctorId}, ObjID: ${doctorIdObj}`);

                        doctor = await doctorinfoCollection.findOne({
                            $or: [
                                { _id: doctorIdObj },
                                { userId: doctorIdObj },
                                { userId: report.doctorId }
                            ]
                        });
                        console.log(`[DEBUG] Doctor found: ${doctor ? doctor.fullName : "NULL"}`);
                    } catch (e) {
                        console.error(`Error looking up doctor for report ${report._id}:`, e);
                    }

                    // Fetch patient info
                    let patient = null;
                    try {
                        if (report.patientId && ObjectId.isValid(report.patientId)) {
                            patient = await usersCollection.findOne({ _id: new ObjectId(report.patientId) });
                            console.log(`[DEBUG] Patient found: ${patient ? patient.fullName : "NULL"} for ID ${report.patientId}`);
                        } else {
                            console.log(`[DEBUG] Invalid/Missing Patient ID: ${report.patientId}`);
                        }
                    } catch (e) {
                        console.error(`Error looking up patient for report ${report._id}:`, e);
                    }

                    return {
                        ...report,
                        doctorName: doctor?.fullName || "Unknown Doctor",
                        specialization: doctor?.specialization || "N/A",
                        patientName: patient?.fullName || patient?.name || "Unknown Patient",
                        doctorStatus: doctor?.accountStatus || "Active",
                        status: report.status
                    };
                }));

                console.log(`[DEBUG] Sending ${enrichedReports.length} enriched reports.`);

                res.status(200).json(enrichedReports);
            } catch (error) {
                console.error("Error fetching reports:", error);
                res.status(500).json({ message: "Failed to fetch reports", error: error.message });
            }
        });

    // ============ PATIENTS APIs ============

    // GET Doctor's Patient List (from appointments)
    app.get("/doctor/patients", verifyJWT, async (req, res) => {
      try {
        const doctorId = req.user.id.toString();

        // Fetch all appointments for this doctor
        const appointments = await appointmentsCollection
          .find({ doctorId: doctorId })
          .sort({ appointmentDate: -1 })
          .toArray();

        if (appointments.length === 0) {
          return res.status(200).json([]);
        }

        // Extract unique patient IDs
        const patientIds = [...new Set(appointments.map(a => a.patientId).filter(id => id && ObjectId.isValid(id)))];

        // Fetch patient user details
        const patientUsers = await usersCollection
          .find({ _id: { $in: patientIds.map(id => new ObjectId(id)) } })
          .toArray();

        // Create a map of patient details
        const patientMap = {};
        patientUsers.forEach(user => {
          patientMap[user._id.toString()] = {
            name: user.fullName || user.name || "Unknown",
            email: user.email,
            userId: user._id.toString()
          };
        });

        // Build unique patient list with appointment info
        const uniquePatients = [];
        const processedPatientIds = new Set();

        appointments.forEach(apt => {
          const patientId = apt.patientId?.toString();
          if (!patientId || processedPatientIds.has(patientId)) return;

          processedPatientIds.add(patientId);

          const patientInfo = patientMap[patientId] || {};
          const patientDetails = apt.patientDetails || {};

          uniquePatients.push({
            _id: patientId,
            name: patientInfo.name || patientDetails.fullName || "Unknown Patient",
            email: patientInfo.email || patientDetails.email || "N/A",
            phone: patientDetails.phoneNumber || "N/A",
            gender: patientDetails.gender || "N/A",
            lastVisit: apt.appointmentDate
              ? new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "—",
            totalAppointments: appointments.filter(a => a.patientId?.toString() === patientId).length
          });
        });

        res.status(200).json(uniquePatients);
      } catch (error) {
        console.error("Error fetching patients:", error);
        res
          .status(500)
          .json({ message: "Error fetching patients", error: error.message });
      }
    });

    // GET Patient Details
    app.get("/doctor/patients/:id", verifyJWT, async (req, res) => {
      try {
        const { id } = req.params;
        const doctorId = req.user.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid patient ID" });
        }

        const patient = await patientsCollection.findOne({
          _id: new ObjectId(id),
          doctorId: doctorId.toString(),
        });

        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json(patient);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching patient details",
          error: error.message,
        });
      }
    });

    // GET Patient Appointment History
    app.get("/doctor/patient/:patientId/appointments", verifyJWT, async (req, res) => {
      try {
        const { patientId } = req.params;
        const doctorId = req.user.id.toString();

        // Fetch all appointments for this patient with this doctor
        const appointments = await appointmentsCollection
          .find({ 
            patientId: patientId,
            doctorId: doctorId
          })
          .sort({ appointmentDate: -1 })
          .toArray();

        res.status(200).json(appointments);
      } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({
          message: "Error fetching patient appointments",
          error: error.message,
        });
      }
    });

    // ============ SCHEDULE/AVAILABILITY APIs ============

    // GET Doctor's Schedule
    app.get("/doctor/schedule", verifyJWT, async (req, res) => {
      try {
        const doctorId = req.user.id.toString();

        const schedules = await schedulesCollection
          .find({ doctorId: doctorId })
          .sort({ date: 1 })
          .toArray();

        // Format schedules with string IDs
        const formattedSchedules = schedules.map((schedule) => ({
          ...schedule,
          _id: schedule._id.toString(),
        }));

        res.status(200).json(formattedSchedules);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error fetching schedule", error: error.message });
      }
    });

    // ADD Schedule Slot
    app.post("/doctor/schedule", verifyJWT, async (req, res) => {
      try {
        const doctorId = req.user.id;
        const { date, day, start, end } = req.body;

        console.log("ADD SLOT REQUEST:");
        console.log(" - User ID from Token:", doctorId);
        console.log(" - Body:", req.body);

        if ((!date && !day) || !start || !end) {
          return res.status(400).json({
            message:
              "Required fields missing. Provide (date or day), start, and end time.",
          });
        }

        // Validate start time is before end time
        if (start >= end) {
          return res.status(400).json({
            message: "Start time must be before end time.",
          });
        }

        // Get doctor's name from users collection
        const doctor = await usersCollection.findOne({
          _id: new ObjectId(doctorId),
        });

        const doctorName = doctor?.fullName || doctor?.name || "Unknown Doctor";

        // Convert date from YYYY-MM-DD to DD-MM-YYYY format
        let formattedDate = null;
        if (date) {
          const [year, month, dayNum] = date.split("-");
          formattedDate = `${dayNum}-${month}-${year}`;
        }

        // Check for conflicting schedules (time overlap on same date)
        const existingSchedules = await schedulesCollection
          .find({
            doctorId: doctorId.toString(),
            date: formattedDate,
          })
          .toArray();

        // Helper function to check if two time ranges overlap
        const timesOverlap = (start1, end1, start2, end2) => {
          return start1 < end2 && start2 < end1;
        };

        // Check if new slot overlaps with any existing slot
        for (const existingSlot of existingSchedules) {
          if (timesOverlap(start, end, existingSlot.start, existingSlot.end)) {
            return res.status(409).json({
              message: `Time conflict detected. You already have a schedule from ${existingSlot.start} to ${existingSlot.end} on this date.`,
              conflictingSlot: {
                date: existingSlot.date,
                start: existingSlot.start,
                end: existingSlot.end,
              },
            });
          }
        }

        const newSlot = {
          doctorId: doctorId.toString(),
          doctorName: doctorName,
          date: formattedDate,
          day: day || null,
          start,
          end,
          createdAt: new Date(),
        };

        console.log(" - Inserting Slot:", newSlot);

        const result = await schedulesCollection.insertOne(newSlot);

        res.status(201).json({
          message: "Schedule slot added successfully",
          slotId: result.insertedId,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error adding schedule", error: error.message });
      }
    });

    // DELETE Schedule Slot
    app.delete("/doctor/schedule/:id", verifyJWT, async (req, res) => {
      try {
        const { id } = req.params;
        const doctorId = req.user.id.toString();

        console.log("DELETE /doctor/schedule/:id - Slot ID:", id);
        console.log("DELETE /doctor/schedule/:id - Doctor ID:", doctorId);

        if (!ObjectId.isValid(id)) {
          console.log("Invalid ObjectId:", id);
          return res.status(400).json({ message: "Invalid schedule ID" });
        }

        const result = await schedulesCollection.deleteOne({
          _id: new ObjectId(id),
          doctorId: doctorId,
        });

        console.log("Delete result:", result);

        if (result.deletedCount === 0) {
          console.log("Schedule not found for deletion");
          return res.status(404).json({ message: "Schedule not found" });
        }

        res.status(200).json({ message: "Schedule slot deleted successfully" });
      } catch (error) {
        console.error("Error deleting schedule:", error);
        res
          .status(500)
          .json({ message: "Error deleting schedule", error: error.message });
      }
    });

    // PUBLIC: Get Doctor Slots (for booking)
    app.get("/api/doctor/slots", async (req, res) => {
      try {
        const { doctorId } = req.query;
        if (!doctorId) {
          return res.status(400).json({ message: "Doctor ID is required" });
        }

        let targetDoctorId = doctorId;
        if (ObjectId.isValid(doctorId)) {
          const doctorInfo = await doctorinfoCollection.findOne({
            _id: new ObjectId(doctorId),
          });
          if (doctorInfo && doctorInfo.userId) {
            targetDoctorId = doctorInfo.userId.toString();
          }
        }

                // Get all schedules and appointments for the doctor
                const schedules = await schedulesCollection.find({ doctorId: targetDoctorId }).toArray();

                // Fetch Normal Appointments
                const normalAppointments = await appointmentsCollection.find({
                    doctorId: targetDoctorId,
                    status: { $nin: ["Cancelled", "cancelled"] }
                }).toArray();

                // Fetch Emergency Appointments
                const emergencyAppointments = await EmergencyCollection.find({
                    doctorId: targetDoctorId,
                    status: { $nin: ["Cancelled", "cancelled"] }
                }).toArray();

                // Merge them for slot checking
                const appointments = [...normalAppointments, ...emergencyAppointments];

                console.log(`[DEBUG SLOTS]Doctor: ${targetDoctorId}, Schedules: ${schedules.length}, Normal: ${normalAppointments.length}, Emergency: ${emergencyAppointments.length}`);

        const groupedByDate = {};
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const today = new Date(todayStr);

        // Generate 14-day window to map "Day" (e.g. Monday) to real dates
        for (let i = 0; i < 14; i++) {
          const currentDate = new Date(today);
          currentDate.setUTCDate(today.getUTCDate() + i);

          const dateStr = currentDate.toISOString().split("T")[0];
          const dayName = currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });

          // Find explicit schedules for this date OR recurring day (case-insensitive)
          const daySchedules = schedules.filter((s) => {
            return (
              s.date === dateStr ||
              (s.day && s.day.toLowerCase() === dayName.toLowerCase())
            );
          });

          if (daySchedules.length > 0) {
            if (!groupedByDate[dateStr]) {
              groupedByDate[dateStr] = { date: dateStr, slots: [] };
            }

            daySchedules.forEach((schedule) => {
              // Check if this specific slot is booked on this specific date
              const isBooked = appointments.some((apt) => {
                try {
                  if (!apt.appointmentDate) return false;
                  const d = new Date(apt.appointmentDate);
                  if (isNaN(d.getTime())) return false;

                  const aptDate = d.toISOString().split("T")[0];
                  const aptTime =
                    apt.appointmentTime || (apt.slotTime && apt.slotTime.start);

                  const matches =
                    aptDate === dateStr && aptTime === schedule.start;
                  if (matches) {
                    console.log(
                      `[DEBUG SLOTS] COLLISION: Slot ${schedule.start} on ${dateStr} is taken by Appointment ${apt._id}`,
                    );
                  }
                  return matches;
                } catch (e) {
                  return false;
                }
              });

              groupedByDate[dateStr].slots.push({
                start: schedule.start,
                end: schedule.end,
                booked: isBooked,
                _id: schedule._id,
              });
            });
          }
        }

        // Sort dates and slots
        const result = Object.values(groupedByDate).sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        result.forEach((day) => {
          day.slots.sort((a, b) => a.start.localeCompare(b.start));
        });

        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching public slots:", error);
        res
          .status(500)
          .json({ message: "Error fetching slots", error: error.message });
      }
    });

    // DEBUG: Get ALL appointments (restricted view)
    app.get("/api/debug/all-appointments", async (req, res) => {
      try {
        const appointments = await appointmentsCollection
          .find({})
          .limit(50)
          .sort({ _id: -1 })
          .toArray();
        res.status(200).json({ count: appointments.length, appointments });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

        // DEBUG: Get all data for a specific doctor
        app.get("/api/debug/doctor-data/:doctorId", async (req, res) => {
            try {
                const { doctorId } = req.params;
                const schedules = await schedulesCollection.find({ doctorId: doctorId }).toArray();
                const appointments = await appointmentsCollection.find({ doctorId: doctorId }).toArray();
                res.status(200).json({ doctorId, schedulesCount: schedules.length, appointmentsCount: appointments.length, schedules, appointments });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // CANCEL Appointment or Emergency
        app.patch("/api/cancel-appointment/:id", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const { type } = req.body; // "Emergency" or "Regular/Normal"
                const userId = req.user.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid ID format" });
                }

                console.log(`[CANCEL REQUEST] User: ${userId}, ID: ${id}, Type: ${type}`);

                let result;
                if (type && type.toLowerCase() === 'emergency') {
                    // Cancel Emergency
                    const emergency = await EmergencyCollection.findOne({ _id: new ObjectId(id) });
                    if (!emergency) {
                        return res.status(404).json({ message: "Emergency appointment not found" });
                    }
                    if (emergency.patientId.toString() !== userId && emergency.doctorId !== userId) {
                        return res.status(403).json({ message: "Unauthorized to cancel this appointment" });
                    }

                    result = await EmergencyCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: { status: "rejected", updatedAt: new Date() } } // "rejected" implies cancelled for emergency
                    );
                } else {
                    // Cancel Regular Appointment
                    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
                    if (!appointment) {
                        return res.status(404).json({ message: "Appointment not found" });
                    }
                    if (appointment.patientId.toString() !== userId && appointment.doctorId !== userId) {
                        return res.status(403).json({ message: "Unauthorized to cancel this appointment" });
                    }

                    result = await appointmentsCollection.updateOne(
                        { _id: new ObjectId(id) },
                        { $set: { status: "Cancelled", updatedAt: new Date() } }
                    );
                }

                if (result.modifiedCount === 0) {
                    return res.status(400).json({ message: "Failed to cancel appointment" });
                }

                res.status(200).json({ message: "Appointment cancelled successfully" });

            } catch (error) {
                console.error("Error cancelling appointment:", error);
                res.status(500).json({ message: "Server error during cancellation", error: error.message });
            }
        });

        // COMPLETE Appointment
        app.patch("/api/complete-appointment/:id", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid ID format" });
                }

                // Check if appointment exists and doctor is authorized
                const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });
                if (!appointment) {
                    return res.status(404).json({ message: "Appointment not found" });
                }
                if (appointment.doctorId !== userId) {
                    return res.status(403).json({ message: "Unauthorized to complete this appointment" });
                }

                // Update appointment status to Completed
                const result = await appointmentsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: "Completed", updatedAt: new Date() } }
                );

                if (result.modifiedCount === 0) {
                    return res.status(400).json({ message: "Failed to complete appointment" });
                }

                res.status(200).json({ message: "Appointment marked as completed successfully" });

            } catch (error) {
                console.error("Error completing appointment:", error);
                res.status(500).json({ message: "Server error during completion", error: error.message });
            }
        });

    app.post("/api/appointments/book", verifyJWT, async (req, res) => {
      try {
        const {
          doctorId,
          date,
          start,
          end,
          type,
          medium,
          patientDetails,
          scheduleId,
        } = req.body;
        const patientId = req.user.id;

                console.log(`[BOOKING ATTEMPT]User: ${patientId}, Doctor: ${doctorId}, Date: ${date}, Start: ${start}, Type: ${type} `);

                if (!doctorId || (!date && type !== 'emergency') || (!start && type !== 'emergency')) {
                    if (type !== 'emergency') {
                        return res.status(400).json({ message: "Doctor ID, date, and time are required" });
                    }
                }

        // FIX: Check if doctorId is an infoId and resolve to userId
        let targetDoctorId = doctorId;
        console.log("Initial doctorId from body:", doctorId);
        if (ObjectId.isValid(doctorId)) {
          const doctorInfo = await doctorinfoCollection.findOne({
            _id: new ObjectId(doctorId),
          });
          if (doctorInfo && doctorInfo.userId) {
            targetDoctorId = doctorInfo.userId.toString();
            console.log("Resolved infoId to userId:", targetDoctorId);
          } else {
            console.log(
              "Could not resolve infoId to userId or already a userId",
            );
          }
        }

        // 1. Patient Restriction: Check if this patient already has an appointment with this doctor on this day
        if (type !== "emergency" && date) {
          const queryDate = new Date(date);
          if (!isNaN(queryDate.getTime())) {
            queryDate.setUTCHours(0, 0, 0, 0);

            const patientDuplicateQuery = {
              patientId,
              doctorId: targetDoctorId,
              appointmentDate: queryDate,
              status: { $nin: ["Cancelled", "cancelled"] },
            };

            const existingForPatient = await appointmentsCollection.findOne(
              patientDuplicateQuery,
            );
            if (existingForPatient) {
              console.log(
                `[BOOKING COLLISION] Patient ${patientId} already has appointment ${existingForPatient._id} (${existingForPatient.status})`,
              );
              return res.status(409).json({
                message: `You already have a ${existingForPatient.status} appointment with this doctor on this date.`,
              });
            }
          }
        }

        // 2. Collision Detection: Check if slot is already booked (only for normal appointments)
        if (type !== "emergency" && date && start) {
          const queryDate = new Date(date);
          queryDate.setUTCHours(0, 0, 0, 0);

          if (!isNaN(queryDate.getTime())) {
            const collisionQuery = {
              doctorId: targetDoctorId,
              appointmentDate: queryDate,
              $or: [{ appointmentTime: start }, { "slotTime.start": start }],
              status: { $nin: ["Cancelled", "cancelled"] },
            };

                        console.log(`Checking collision for doctor ${targetDoctorId} on date ${queryDate.toISOString()} at time ${start} `);

                        const existing = await appointmentsCollection.findOne(collisionQuery);

                        // Check for collisions in emergency collection as well
                        const existingEmergency = await EmergencyCollection.findOne({
                            doctorId: targetDoctorId,
                            appointmentDate: queryDate,
                            $or: [
                                { "slotTime.start": start },
                                { appointmentTime: start }
                            ],
                            status: { $nin: ["Cancelled", "cancelled"] }
                        });

                        if (existing || existingEmergency) {
                            console.log(`[BOOKING COLLISION] Slot is booked by ${existing ? 'Appointment ' + existing._id : 'Emergency ' + existingEmergency._id}`);
                            return res.status(409).json({ message: "Slot is already booked by another patient." });
                        }
                    }
                }

        // 2. Fetch Patient Info
        const patientProfile = await usersCollection.findOne({
          _id: new ObjectId(patientId),
        });

        // 3. Create Appointment
        let consultationFee = 0;
        const doctorProfileId = ObjectId.isValid(doctorId)
          ? new ObjectId(doctorId)
          : null;
        const doctorUserId = ObjectId.isValid(targetDoctorId)
          ? new ObjectId(targetDoctorId)
          : null;

                const doctorInfo = await doctorinfoCollection.findOne({
                    $or: [
                        { _id: doctorProfileId },
                        { userId: doctorProfileId },
                        { userId: doctorUserId },
                        { userId: targetDoctorId }
                    ]
                });

                if (doctorInfo?.accountStatus === 'Banned') {
                    return res.status(403).json({ message: "This doctor is currently banned and cannot accept new appointments." });
                }

        if (doctorInfo && doctorInfo.consultationFee) {
          consultationFee = parseInt(doctorInfo.consultationFee) || 0;
        }

                const appointment = {
                    type: type || "normal",
                    medium: medium || "physical",
                    doctorId: targetDoctorId,
                    patientId,
                    scheduleId: scheduleId || null,
                    appointmentDate: (() => {
                        if (!date) return null;
                        const d = new Date(date);
                        if (isNaN(d.getTime())) return null;
                        d.setUTCHours(0, 0, 0, 0);
                        return d;
                    })(),
                    slotTime: start && end ? { start, end } : null,
                    // For legacy support if needed
                    appointmentTime: start || null,
                    endTime: end || null,
                    patientDetails: patientDetails || {
                        fullName: patientProfile?.fullName || patientProfile?.name || "Unknown",
                        email: patientProfile?.email || "Unknown",
                        gender: patientProfile?.gender || "",
                        dob: patientProfile?.dob || "",
                        phoneNumber: patientProfile?.phoneNumber || ""
                    },
                    status: "pending",
                    paymentStatus: "Unpaid",
                    amount: consultationFee,
                    createdAt: new Date()
                };

        const result = await appointmentsCollection.insertOne(appointment);

        res.status(200).json({
          message: "Appointment request submitted!",
          appointmentId: result.insertedId,
          fee: consultationFee,
        });
      } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).json({
          message: "Error booking the appointment. Please try again.",
          error: error.message,
        });
      }
    });

    // PAYMENT CHARGE API
    app.post("/api/payment/charge", verifyJWT, async (req, res) => {
      try {
        const { appointmentId, amount, paymentInfo } = req.body;
        const userId = req.user.id;

        if (!appointmentId || !amount) {
          return res
            .status(400)
            .json({ message: "Appointment ID and Amount are required" });
        }

        // Simulate Payment Gateway (e.g., Stripe)
        // In a real app, you'd use paymentInfo.cardNumber with Stripe API here.
        const paymentSuccess = true;

        if (paymentSuccess) {
          // 1. Try to find in Normal Appointments
          let appointment = await appointmentsCollection.findOne({
            _id: new ObjectId(appointmentId),
          });
          let isEmergency = false;

          // 2. If not found, try to find in Emergency Collection
          if (!appointment) {
            appointment = await EmergencyCollection.findOne({
              _id: new ObjectId(appointmentId),
            });
            isEmergency = true;
          }

          if (!appointment) {
            return res
              .status(404)
              .json({ message: "Appointment or Emergency record not found" });
          }

                    // 3. Prepare Transaction Details
                    const transaction = {
                        appointmentId,
                        userId,
                        amount: parseInt(amount),
                        date: new Date(),
                        method: "Credit Card",
                        status: "Success",
                        type: isEmergency ? "emergency" : "normal",
                        transactionId: (isEmergency ? "TXN_EMG" : "TXN") + Date.now()
                    };

                    // 4. Update the correct collection
                    if (isEmergency) {
                        await EmergencyCollection.updateOne(
                            { _id: new ObjectId(appointmentId) },
                            { $set: { paymentStatus: "Paid", status: "Confirmed" } }
                        );

                        // If telemedicine, create consultation record for Emergency
                        if (appointment.meetingType === "telemedicine") {
                            const consultation = {
                                appointmentId: appointment._id.toString(),
                                patientId: appointment.patientId || appointment.userId, // Emergency might use userId or patientId, check creation
                                doctorId: appointment.doctorId,
                                agoraConfig: {
                                    channelName: `meeting_${appointment._id.toString().slice(-8)}`,
                                    token: "mock_token_" + Math.random().toString(36).substring(7),
                                    uid: Math.floor(Math.random() * 10000)
                                },
                                meetingStatus: "scheduled",
                                clinicalNotes: "",
                                prescriptionUrl: null,
                                createdAt: new Date()
                            };
                            await consultationsCollection.insertOne(consultation);
                        }
                    } else {
                        await appointmentsCollection.updateOne(
                            { _id: new ObjectId(appointmentId) },
                            { $set: { paymentStatus: "Paid", status: "Confirmed" } }
                        );

            // If telemedicine, create consultation record (Normal Appointments only for now)
            if (appointment.medium === "telemedicine") {
              const consultation = {
                appointmentId: appointment._id.toString(),
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                agoraConfig: {
                  channelName: `meeting_${appointment._id.toString().slice(-8)}`,
                  token:
                    "mock_token_" + Math.random().toString(36).substring(7),
                  uid: Math.floor(Math.random() * 10000),
                },
                meetingStatus: "scheduled",
                clinicalNotes: "",
                prescriptionUrl: null,
                createdAt: new Date(),
              };
              await consultationsCollection.insertOne(consultation);
            }
          }

                    // 5. Log Transaction
                    await transactionsCollection.insertOne(transaction);

          res.status(200).json({
            message: "Payment Successful",
            paymentId: transaction.transactionId,
          });
        } else {
          res.status(400).json({
            message: "Transaction failed. Please check your card or network.",
          });
        }
      } catch (error) {
        console.error("Payment Error:", error);
        res
          .status(500)
          .json({ message: "Payment processing failed", error: error.message });
      }
    });

    // GET Transaction Details (for Invoice Page)
    app.get("/api/transactions/:paymentId", verifyJWT, async (req, res) => {
      try {
        const { paymentId } = req.params;
        const transactionsCollection = client
          .db("mediAi")
          .collection("transactions");
        const transaction = await transactionsCollection.findOne({
          transactionId: paymentId,
        });
        if (!transaction)
          return res.status(404).json({ message: "Transaction not found" });

        // Return simplified structure for Invoice Page
        res.status(200).json({
          paymentId: transaction.transactionId,
          appointmentId: transaction.appointmentId,
          userId: transaction.userId,
          amount: transaction.amount,
          timestamp: transaction.date,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error fetching transaction",
          error: error.message,
        });
      }
    });

    // GET Generated Invoice PDF via External API (invoice-generator.com)
    app.get("/invoices/invoice-:paymentId.pdf", async (req, res) => {
      try {
        const { paymentId } = req.params;

        // 1. Fetch Transaction
        const transaction = await transactionsCollection.findOne({
          transactionId: paymentId,
        });
        if (!transaction) return res.status(404).send("Invoice not found");

        // 2. Fetch Appointment & Profiles
        let appointment;
        let doctorName = "MediAI Doctor";
        let patientDetails = { fullName: "Valued Patient", email: "" };

        if (transaction.type === "emergency") {
          appointment = await EmergencyCollection.findOne({
            _id: new ObjectId(transaction.appointmentId),
          });
          if (!appointment)
            return res.status(404).send("Emergency record not found");
          doctorName = appointment.doctorName || doctorName;
          patientDetails = {
            fullName: appointment.fullName,
            email: appointment.email,
          };
        } else {
          appointment = await appointmentsCollection.findOne({
            _id: new ObjectId(transaction.appointmentId),
          });
          if (!appointment)
            return res.status(404).send("Appointment not found");

          const patient = await usersCollection.findOne({
            _id: new ObjectId(appointment.patientId),
          });
          if (patient)
            patientDetails = {
              fullName: patient.fullName || patient.name,
              email: patient.email,
            };

          // Resolve doctor name
          const doctorProfileId = ObjectId.isValid(appointment.doctorId)
            ? new ObjectId(appointment.doctorId)
            : null;
          const doctorInfo = await doctorinfoCollection.findOne({
            $or: [
              { _id: doctorProfileId },
              { userId: appointment.doctorId },
              { userId: doctorProfileId },
            ],
          });
          if (doctorInfo) doctorName = doctorInfo.fullName || doctorName;
        }

                // 3. Prepare data for Invoice-Generator.com API
                const invoiceData = {
                    logo: "https://i.ibb.co/vzrKxGf/logo.png", // Replace with your actual logo URL
                    from: "MediAI Health Services\nsupport@mediai.com",
                    to: `${patientDetails.fullName}\n${patientDetails.email}`,
                    number: transaction.transactionId,
                    date: new Date(transaction.date).toLocaleDateString(),
                    items: [
                        {
                            name: `Consultation with ${doctorName}`,
                            quantity: 1,
                            unit_cost: transaction.amount
                        }
                    ],
                    currency: "BDT",
                    notes: `Type: ${transaction.type || "Appointment"} | Medium: ${appointment.meetingType || appointment.medium || "N/A"}`,
                    terms: "Thank you for choosing MediAI."
                };

                // 4. Call Invoice-Generator.com API
                const apiResponse = await fetch("https://invoice-generator.com", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(invoiceData)
                });

                if (!apiResponse.ok) {
                    const errorText = await apiResponse.text();
                    throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
                }

                // 5. Stream the PDF response
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename=invoice-${paymentId}.pdf`);

                const buffer = await apiResponse.arrayBuffer();
                res.send(Buffer.from(buffer));

            } catch (error) {
                console.error("Error generating external invoice:", error);
                res.status(500).send("Error generating invoice PDF: " + error.message);
            }
        });

    // ============ HEALTH TOOLS APIs ============

    // BMI Calculator
    app.post("/health/bmi", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { weight, height } = req.body;

        if (!weight || !height || weight <= 0 || height <= 0) {
          return res.status(400).json({ message: "Invalid weight or height" });
        }

        // Calculate BMI
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

        // Determine category
        let category;
        if (bmi < 18.5) category = "Underweight";
        else if (bmi < 25) category = "Normal";
        else if (bmi < 30) category = "Overweight";
        else category = "Obese";

        // Save to database
        const record = {
          userId: userId.toString(),
          weight,
          height,
          bmi,
          category,
          calculatedAt: new Date(),
        };

        await bmiCollection.insertOne(record);

        res.status(200).json({
          message: "BMI calculated successfully",
          data: { bmi, category },
        });
      } catch (error) {
        console.error("Error calculating BMI:", error);
        res.status(500).json({ message: "Failed to save BMI data" });
      }
    });

    app.get("/health/bmi/history", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const history = await bmiCollection
          .find({ userId: userId.toString() })
          .sort({ calculatedAt: -1 })
          .limit(10)
          .toArray();

        res.status(200).json(history);
      } catch (error) {
        console.error("Error fetching BMI history:", error);
        res.status(500).json({ message: "Failed to fetch BMI history" });
      }
    });

    // Water Intake Tracker
    app.post("/health/water/goal", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { dailyGoal } = req.body;

        if (!dailyGoal || dailyGoal <= 0) {
          return res.status(400).json({ message: "Invalid daily goal" });
        }

        // Get today's date in YYYY-MM-DD format (local timezone)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        await waterCollection.updateOne(
          { userId: userId.toString(), date: today },
          { $set: { dailyGoal, date: today } },
          { upsert: true }
        );

        res.status(200).json({ message: "Daily goal updated" });
      } catch (error) {
        console.error("Error setting water goal:", error);
        res.status(500).json({ message: "Failed to set goal" });
      }
    });

    app.post("/health/water/log", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }

        // Get today's date in YYYY-MM-DD format (local timezone)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        // Get or create today's record
        let record = await waterCollection.findOne({
          userId: userId.toString(),
          date: today,
        });

        if (!record) {
          record = {
            userId: userId.toString(),
            date: today,
            intake: 0,
            dailyGoal: 2000,
            logs: [],
          };
        }

        // Add the log
        record.intake = (record.intake || 0) + amount;
        record.logs = record.logs || [];
        record.logs.push({
          amount,
          timestamp: new Date(),
        });

        await waterCollection.updateOne(
          { userId: userId.toString(), date: today },
          { $set: record },
          { upsert: true }
        );

        res.status(200).json({ message: "Water intake logged" });
      } catch (error) {
        console.error("Error logging water:", error);
        res.status(500).json({ message: "Failed to log water intake" });
      }
    });

    app.get("/health/water/today", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        
        // Get today's date in YYYY-MM-DD format (local timezone)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        let record = await waterCollection.findOne({
          userId: userId.toString(),
          date: today,
        });

        if (!record) {
          record = {
            intake: 0,
            dailyGoal: 2000,
            logs: [],
            progress: 0,
          };
        } else {
          record.progress = Math.round(
            (record.intake / record.dailyGoal) * 100
          );
        }

        res.status(200).json(record);
      } catch (error) {
        console.error("Error fetching today's water data:", error);
        res.status(500).json({ message: "Failed to fetch data" });
      }
    });

    app.get("/health/water/weekly", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        
        // Get the last 7 days in local timezone
        const dates = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }

        const records = await waterCollection
          .find({
            userId: userId.toString(),
            date: { $in: dates },
          })
          .toArray();

        // Fill in missing dates with zero intake
        const weeklyData = dates.map((date) => {
          const record = records.find((r) => r.date === date);
          return {
            date,
            intake: record?.intake || 0,
            dailyGoal: record?.dailyGoal || 2000,
          };
        });

        res.status(200).json(weeklyData);
      } catch (error) {
        console.error("Error fetching weekly water data:", error);
        res.status(500).json({ message: "Failed to fetch weekly data" });
      }
    });

    // Sleep Duration Tracker
    app.post("/health/sleep", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const { bedtime, wakeTime, quality } = req.body;

        if (!bedtime || !wakeTime) {
          return res.status(400).json({ message: "Missing bedtime or wake time" });
        }

        // Calculate duration in hours
        const bedDate = new Date(bedtime);
        const wakeDate = new Date(wakeTime);
        const durationMs = wakeDate - bedDate;
        const duration = (durationMs / (1000 * 60 * 60)).toFixed(1);

        if (duration <= 0 || duration > 24) {
          return res.status(400).json({ message: "Invalid sleep duration" });
        }

        const record = {
          userId: userId.toString(),
          bedtime: bedDate,
          wakeTime: wakeDate,
          duration: parseFloat(duration),
          quality: quality || "Average",
          loggedAt: new Date(),
        };

        await sleepCollection.insertOne(record);

        res.status(200).json({
          message: "Sleep logged successfully",
          data: { duration, quality },
        });
      } catch (error) {
        console.error("Error logging sleep:", error);
        res.status(500).json({ message: "Failed to log sleep" });
      }
    });

    app.get("/health/sleep/history", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;
        const history = await sleepCollection
          .find({ userId: userId.toString() })
          .sort({ loggedAt: -1 })
          .limit(10)
          .toArray();

        res.status(200).json(history);
      } catch (error) {
        console.error("Error fetching sleep history:", error);
        res.status(500).json({ message: "Failed to fetch sleep history" });
      }
    });

    app.get("/health/sleep/weekly", verifyJWT, async (req, res) => {
      try {
        const userId = req.user.id;

        // Get sleep records from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const records = await sleepCollection
          .find({
            userId: userId.toString(),
            loggedAt: { $gte: sevenDaysAgo },
          })
          .toArray();

        if (records.length === 0) {
          return res.status(200).json({
            totalRecords: 0,
            averageDuration: 0,
          });
        }

        const totalDuration = records.reduce(
          (sum, record) => sum + record.duration,
          0
        );
        const averageDuration = (totalDuration / records.length).toFixed(1);

        res.status(200).json({
          totalRecords: records.length,
          averageDuration,
        });
      } catch (error) {
        console.error("Error fetching weekly sleep summary:", error);
        res.status(500).json({ message: "Failed to fetch weekly summary" });
      }
    });

    // ============ CONSULTATIONS & PRESCRIPTIONS APIs ============

    // GET Consultation Details (for Telemedicine)
    app.get(
      "/api/consultations/:appointmentId",
      verifyJWT,
      async (req, res) => {
        try {
          const { appointmentId } = req.params;
          const consultation = await consultationsCollection.findOne({
            appointmentId,
          });
          if (!consultation)
            return res.status(404).json({ message: "Consultation not found" });
          res.status(200).json(consultation);
        } catch (error) {
          res.status(500).json({
            message: "Error fetching consultation",
            error: error.message,
          });
        }
      },
    );

    // UPDATE Consultation (Notes/Status)
    app.patch("/api/consultations/:id", verifyJWT, async (req, res) => {
      try {
        const { id } = req.params;
        const { clinicalNotes, meetingStatus, prescriptionUrl } = req.body;

        const updateDoc = { $set: { updatedAt: new Date() } };
        if (clinicalNotes !== undefined)
          updateDoc.$set.clinicalNotes = clinicalNotes;
        if (meetingStatus !== undefined)
          updateDoc.$set.meetingStatus = meetingStatus;
        if (prescriptionUrl !== undefined)
          updateDoc.$set.prescriptionUrl = prescriptionUrl;

        const result = await consultationsCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc,
        );

        if (result.matchedCount === 0)
          return res.status(404).json({ message: "Consultation not found" });

        // If meeting is completed, update appointment status too
        if (meetingStatus === "completed") {
          const cons = await consultationsCollection.findOne({
            _id: new ObjectId(id),
          });
          if (cons && cons.appointmentId) {
            await appointmentsCollection.updateOne(
              { _id: new ObjectId(cons.appointmentId) },
              { $set: { status: "completed" } },
            );
          }
        }

        res.status(200).json({ message: "Consultation updated successfully" });
      } catch (error) {
        res.status(500).json({
          message: "Error updating consultation",
          error: error.message,
        });
      }
    });

    // POST - Create Prescription
    app.post("/api/prescriptions", verifyJWT, async (req, res) => {
      try {
        const {
          appointmentId,
          patientId,
          doctorId,
          medicineList,
          advice,
          diagnosis,
        } = req.body;

        if (!appointmentId || !patientId || !doctorId) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const prescription = {
          appointmentId,
          patientId,
          doctorId,
          medicineList, // Array of objects { name, dosage, duration, instructions }
          advice,
          diagnosis,
          createdAt: new Date(),
        };

        const result = await prescriptionsCollection.insertOne(prescription);

        // Update appointment status to completed when prescription is uploaded (as per requirements)
        await appointmentsCollection.updateOne(
          { _id: new ObjectId(appointmentId) },
          { $set: { status: "completed" } },
        );

        res.status(200).json({
          message: "Prescription uploaded and appointment completed!",
          prescriptionId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error uploading prescription",
          error: error.message,
        });
      }
    });

    // doctor collection end[Khalid]------------------

        //Telemedicine collection start[Maliha]------------------
        // ==================== SOCKET.IO & AGORA SETUP ====================

        // Track active participants in rooms
        const activeParticipants = new Map(); // RoomId -> Set(userIds)

    // Socket.io connection handling
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

            // Join consultation room
            socket.on("join-consultation", (data) => {
                const { consultationId, userId, role } = data;
                const room = `consultation - ${consultationId} `;
                socket.join(room);
                socket.userId = userId;
                socket.consultationId = consultationId;

                // Track participant
                if (!activeParticipants.has(consultationId)) {
                    activeParticipants.set(consultationId, new Set());
                }
                activeParticipants.get(consultationId).add(userId);

                console.log(`User ${userId} (${role}) joined room ${room}`);

                // Notify others in the room
                socket.to(room).emit("user-joined", { userId, role });

                // Send current room status back to joining user
                const participants = Array.from(activeParticipants.get(consultationId));
                socket.emit("room-status", { participants });
            });

            // Send chat message
            socket.on("send-message", (data) => {
                const { consultationId, userId, role, message, timestamp } = data;
                const room = `consultation - ${consultationId} `;
                io.to(room).emit("receive-message", {
                    userId,
                    role,
                    message,
                    timestamp
                });
            });

            // Leave consultation room
            socket.on("leave-consultation", (data) => {
                const { consultationId, userId } = data;
                const room = `consultation-${consultationId}`;

                if (activeParticipants.has(consultationId)) {
                    activeParticipants.get(consultationId).delete(userId);
                    if (activeParticipants.get(consultationId).size === 0) {
                        activeParticipants.delete(consultationId);
                    }
                }

                socket.leave(room);
                socket.to(room).emit("user-left", { userId });
            });

            socket.on("disconnect", () => {
                if (socket.consultationId && socket.userId) {
                    const room = `consultation-${socket.consultationId}`;
                    if (activeParticipants.has(socket.consultationId)) {
                        activeParticipants.get(socket.consultationId).delete(socket.userId);
                        if (activeParticipants.get(socket.consultationId).size === 0) {
                            activeParticipants.delete(socket.consultationId);
                        }
                    }
                    socket.to(room).emit("user-left", { userId: socket.userId });
                }
                console.log("User disconnected:", socket.id);
            });
        });

    // Generate Agora RTC Token
    app.post("/consultation/agora-token", verifyJWT, async (req, res) => {
      try {
        const { consultationId, channelName } = req.body;
        const userId = req.user.id || req.user.userId || req.user._id;

        // Agora credentials (get from https://console.agora.io/)
        const APP_ID = process.env.AGORA_APP_ID || "YOUR_AGORA_APP_ID";
        const APP_CERTIFICATE =
          process.env.AGORA_APP_CERTIFICATE || "YOUR_AGORA_APP_CERTIFICATE";

        if (!APP_ID || !APP_CERTIFICATE || APP_ID === "YOUR_AGORA_APP_ID") {
          return res.status(500).json({
            message:
              "Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env file. Get free credentials from https://console.agora.io/",
          });
        }

        // Verify consultation access
        const consultation = await consultationsCollection.findOne({
          _id: new ObjectId(consultationId),
        });

        if (!consultation) {
          return res.status(404).json({ message: "Consultation not found" });
        }

        // Verify user has access
        const userObjectId =
          userId instanceof ObjectId ? userId : new ObjectId(userId);
        const user = await usersCollection.findOne({ _id: userObjectId });

        const isDoctor =
          user.userRole === "doctor" &&
          consultation.doctorId === userId.toString();
        const isPatient =
          user.userRole === "user" &&
          consultation.patientId === userId.toString();

        if (!isDoctor && !isPatient) {
          return res
            .status(403)
            .json({ message: "Unauthorized to access this consultation" });
        }

        // Generate token (valid for 24 hours)
        const role = RtcRole.PUBLISHER; // Both can publish audio/video
        const expirationTimeInSeconds =
          Math.floor(Date.now() / 1000) + 24 * 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
          APP_ID,
          APP_CERTIFICATE,
          channelName || consultation.roomId,
          userId.toString(),
          role,
          expirationTimeInSeconds,
        );

                res.status(200).json({
                    token: token,
                    appId: APP_ID,
                    channelName: channelName || consultation.roomId,
                    uid: userId.toString()
                });

            } catch (error) {
                console.error("Error generating Agora token:", error);
                res.status(500).json({ message: "Error generating Agora token", error: error.message });
            }
        });
        // Telemedicine collection end[Maliha]------------------
        // Generate/Get Consultation Token (Session)
        app.post("/consultation/generate-token", verifyJWT, async (req, res) => {
            try {
                const { appointmentId } = req.body;
                const userId = req.user.id;

                if (!appointmentId) return res.status(400).json({ message: "Appointment ID required" });

                // Fetch appointment details first to get accurate IDs
                let appointment = await appointmentsCollection.findOne({ _id: new ObjectId(appointmentId) });
                let doctorId, patientId;

                if (appointment) {
                    doctorId = appointment.doctorId;
                    patientId = appointment.patientId;
                } else {
                    // Try EmergencyCollection
                    appointment = await EmergencyCollection.findOne({ _id: new ObjectId(appointmentId) });
                    if (appointment) {
                        doctorId = appointment.doctorId;
                        patientId = appointment.patientId;
                    }
                }

                if (!appointment) return res.status(404).json({ message: "Appointment not found" });

                // Check or Create Consultation Session
                let consultation = await consultationsCollection.findOne({ appointmentId: appointmentId });

                if (!consultation) {
                    consultation = {
                        appointmentId,
                        patientId: patientId,
                        doctorId: doctorId,
                        status: "active",
                        createdAt: new Date(),
                        messages: []
                    };
                    const result = await consultationsCollection.insertOne(consultation);
                    consultation._id = result.insertedId;
                }

                // Generate Agora Token (Mock for now if env missing, or real if present)
                let agoraToken = null;
                const appId = process.env.AGORA_APP_ID;
                const appCertificate = process.env.AGORA_APP_CERTIFICATE;
                const channelName = consultation._id.toString();

                const responseData = {
                    consultationId: consultation._id,
                    appointment: appointment,
                    channelName: channelName
                };

                if (appId && appCertificate) {
                    const uid = Math.floor(Math.random() * 100000);
                    const role = RtcRole.PUBLISHER;
                    const expirationTimeInSeconds = 3600;
                    const currentTimestamp = Math.floor(Date.now() / 1000);
                    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

                    agoraToken = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);

                    res.json({
                        ...responseData,
                        agoraAppId: appId,
                        agoraToken: agoraToken,
                        uid: uid
                    });
                } else {
                    console.log("Agora credentials missing in .env");
                    res.json({
                        ...responseData,
                        message: "Agora credentials missing, mock response",
                        mock: true
                    });
                }

            } catch (error) {
                console.error("Error generating token:", error);
                res.status(500).json({ message: "Server error" });
            }
        });

        // Submit Rating
        app.post("/consultation/:id/rating", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const { rating, comment } = req.body;

                await consultationsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { rating, ratingComment: comment, ratedAt: new Date() } }
                );

                res.status(200).json({ message: "Rating submitted" });
            } catch (error) {
                res.status(500).json({ message: "Error submitting rating" });
            }
        });

        // Get Prescription
        app.get("/consultation/:id/prescription", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const consultation = await consultationsCollection.findOne({ _id: new ObjectId(id) });

                if (!consultation || !consultation.prescription) {
                    return res.status(404).json({ message: "Prescription not found" });
                }

                res.status(200).json(consultation.prescription);
            } catch (error) {
                res.status(500).json({ message: "Error fetching prescription" });
            }
        });

        // End Consultation
        app.post("/consultation/:id/end", verifyJWT, async (req, res) => {
            try {
                const { id } = req.params;
                const { outcome } = req.body;
                console.log(`[END_CONSULTATION] Request received for ID: ${id}`);

                if (!ObjectId.isValid(id)) {
                    console.log(`[END_CONSULTATION] Invalid ID: ${id}`);
                    return res.status(400).json({ message: "Invalid consultation ID" });
                }

                const result = await consultationsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: "Completed",
                            outcome: outcome || "Completed",
                            endedAt: new Date()
                        }
                    }
                );

                console.log(`[END_CONSULTATION] Key update result:`, result);

                if (result.matchedCount === 0) {
                    console.log(`[END_CONSULTATION] No document found for ID: ${id}`);
                    return res.status(404).json({ message: "Consultation not found" });
                }

                res.status(200).json({ message: "Consultation ended" });
            } catch (error) {
                console.error("[END_CONSULTATION] Error ending consultation:", error);
                res.status(500).json({ message: "Error ending consultation", error: error.message });
            }
        });

        // ============ END CONSULTATION APIs ============

        // ============ SOCKET.IO LOGIC ============
        io.on("connection", (socket) => {
            console.log("New client connected:", socket.id);

            socket.on("join-consultation", (data) => {
                const { consultationId, userId, role } = data;
                socket.join(consultationId);
                console.log(`User ${userId} (${role}) joined consultation ${consultationId}`);

                // Notify others in room
                socket.to(consultationId).emit("user-joined", { userId, role });

                // Check if room has others
                const room = io.sockets.adapter.rooms.get(consultationId);
                const participants = room ? Array.from(room) : [];
                // socket.emit("room-status", { participants: participants.map(id => io.sockets.sockets.get(id)?.handshake?.auth?.userId || id) });
                // Simplified room status
                socket.emit("room-status", { participants });
            });

            socket.on("send-message", (data) => {
                const { consultationId, message, sender, role, timestamp } = data;
                console.log(`Message in ${consultationId}: ${message}`);
                // Broadcast to everyone in the room EXCEPT sender
                socket.to(consultationId).emit("receive-message", data);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });

    // Root route
    app.get("/", (req, res) => res.send("MediAi server is running"));

        // Start server only after MongoDB connects and all routes are registered
        server.listen(port, () => {
            console.log(`MediAi server is running at http://localhost:${port}`);
            console.log(`MongoDB connected successfully`);
            console.log(`Socket.io server initialized`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1); // Exit if connection fails
    } finally {
        // Do not close client, keep server running
    }
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
