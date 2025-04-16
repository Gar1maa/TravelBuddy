const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3100",
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/test')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));
// 🔹 Route to change password directly
app.post("/change-password", async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        // Hash new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password changed successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});
// Serve HTML files
const htmlFiles = [
    'about.html',
    'chat.html',
    'choosepartner.html',
    'contact.html',
    'createplan.html',
    'dash.html',
    'features.html',
    'forgot.html',
    'login.html',
    'partnerdetails.html',
    'history.html',
    'register.html',
    'terms.html'
];

htmlFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

const requestSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverEmail: { type: String, required: true }, // Partner email
    status: { type: String, default: 'pending' }
}, { timestamps: true });

const Request = mongoose.model('Request', requestSchema);
app.post('/api/send-request', async (req, res) => {
    const { senderId, receiverEmail } = req.body;

    try {
        // Check if request already exists
        const existingRequest = await Request.findOne({ senderId, receiverEmail, status: 'pending' });
        if (existingRequest) {
            return res.status(200).json({ message: 'Request already sent' });
        }

        // If no existing request, create a new one
        const newRequest = new Request({ senderId, receiverEmail });
        await newRequest.save();
        res.status(201).json({ message: 'Request sent successfully' });
    } catch (err) {
        console.error("Error sending request:", err);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

   //Add an API to Check Request Status
   app.get('/api/check-request', async (req, res) => {
    const { senderId, receiverEmail } = req.query;

    try {
        const existingRequest = await Request.findOne({ senderId, receiverEmail });

        if (existingRequest) {
            return res.status(200).json({ requestStatus: existingRequest.status }); // Return request status
        }

        res.status(200).json({ requestStatus: 'none' }); // No request found
    } catch (err) {
        console.error("Error checking request status:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

//add a delete request api
app.delete('/api/cancel-request', async (req, res) => {
    const { senderId, receiverEmail } = req.body;

    try {
        const deletedRequest = await Request.findOneAndDelete({ senderId, receiverEmail, status: 'pending' });

        if (!deletedRequest) {
            return res.status(404).json({ message: "No pending request found to cancel" });
        }

        res.status(200).json({ message: "Request canceled successfully" });
    } catch (err) {
        console.error("Error canceling request:", err);
        res.status(500).json({ error: 'Server error while canceling request' });
    }
});

app.get('/api/received-requests/:email', async (req, res) => {
    const receiverEmail = req.params.email;

    try {
        const requests = await Request.find({ receiverEmail, status: 'pending' })
    .populate('senderId', 'firstName lastName email profilePic') // Include profilePic
    .lean();
        // Fetch travel plans for each sender
        for (let req of requests) {
            const receiver = await User.findOne({ email: req.receiverEmail });
            const plan = await TravelPlan.findOne({ userId: receiver._id }).lean();
            req.travelPlan = plan || {};            
        }

        res.status(200).json(requests);
    } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Accept or Reject a Request
app.put('/api/update-request/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Update request status
        const updatedRequest = await Request.findByIdAndUpdate(
            requestId,
            { status },
            { new: true }
        ).populate('senderId', 'firstName lastName email'); // Ensure sender details are included

        if (!updatedRequest) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Fetch the receiver details (partner)
        const partner = await User.findOne({ email: updatedRequest.receiverEmail });

        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        // Fetch travel plan for the receiver
        const travelPlan = await TravelPlan.findOne({ userId: partner._id }).lean();
        const destination = travelPlan?.destination || 'N/A'; // Get destination properly

        // Partner's name (user who accepted/rejected the request)
        const partnerName = `${partner.firstName} ${partner.lastName}`;

        // Notify the sender with the correct destination
        if (updatedRequest.senderId.email && users[updatedRequest.senderId.email]) {
            io.to(users[updatedRequest.senderId.email]).emit('requestStatusUpdate', {
                message: `Notification: ${partnerName} has ${status} your request for ${destination}.`,
                partnerName,
                status,
                destination
            });
        }

        res.status(200).json({ message: `Request ${status} successfully`, request: updatedRequest });
    } catch (err) {
        console.error('Error updating request status:', err);
        res.status(500).json({ error: 'Server error while updating request' });
    }
});


// Default route to load dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    genderType: { type: String, required: true },
    bio: { type: String },
    dob: { type: Date, required: true },
    streetAddress: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    pinCode: { type: String, required: true },
    terms: { type: Boolean, required: true },
    profilePic: { type: String } 
}, { timestamps: true });
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store images in an 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Upload Profile Picture API
app.post('/api/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        const { email } = req.body; // Identify user
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!filePath) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { profilePic: filePath },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile picture updated successfully', profilePic: filePath });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Serve static profile pictures
app.use('/uploads', express.static('uploads'));
//Allow Users to Delete Profile Picture
const fs = require('fs');

app.delete('/api/delete-profile-pic', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user || !user.profilePic) {
            return res.status(404).json({ message: "Profile picture not found" });
        }

        // Delete the image file
        const filePath = path.join(__dirname, user.profilePic);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from database
        user.profilePic = null;
        await user.save();

        res.status(200).json({ message: "Profile picture deleted successfully" });
    } catch (error) {
        console.error("Error deleting profile picture:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Define Message Schema for Chat
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    deletedBy: { type: [String], default: [] } // ✅ Fixed syntax issue
});

const Message = mongoose.model('Message', messageSchema);

// **Real-Time Chat with Socket.IO**
const users = {}; // Store connected users

io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // Handle user joining
    socket.on('join', (email) => {
        users[email] = socket.id; // Map email to socket ID
        console.log(`User ${email} joined with socket ID: ${socket.id}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ sender, receiver, message }) => {
        const newMessage = new Message({ sender, receiver, message });
        await newMessage.save();

        // Send message to sender and receiver
        if (users[receiver]) {
            io.to(users[receiver]).emit(`receiveMessage-${receiver}`, { sender, message });
        }
        io.to(users[sender]).emit(`receiveMessage-${sender}`, { sender, message });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        for (const email in users) {
            if (users[email] === socket.id) {
                delete users[email];
                console.log(`User ${email} disconnected`);
                break;
            }
        }
    });
});

//
app.get('/api/messages/:email/:chatWith', async (req, res) => {
    const { email, chatWith } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { sender: email, receiver: chatWith },
                { sender: chatWith, receiver: email }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API to fetch chat history
app.get("/api/messages/:email", async (req, res) => {
    const userEmail = req.params.email;

    try {
        const messages = await Message.find({
            $or: [{ sender: userEmail }, { receiver: userEmail }],
            deletedBy: { $ne: userEmail } // ✅ Exclude deleted chats
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, error: "Failed to fetch messages." });
    }
});
//
app.delete("/api/messages/delete-chat", async (req, res) => {
    const { userEmail, chatPartner } = req.body;

    try {
        // Step 1: Mark messages as deleted by the user
        await Message.updateMany(
            {
                $or: [
                    { sender: userEmail, receiver: chatPartner },
                    { sender: chatPartner, receiver: userEmail }
                ]
            },
            { $addToSet: { deletedBy: userEmail } }
        );

        // Step 2: Permanently delete messages if both users deleted them
        await Message.deleteMany({
            $or: [
                { sender: userEmail, receiver: chatPartner },
                { sender: chatPartner, receiver: userEmail }
            ],
            deletedBy: { $all: [userEmail, chatPartner] } // ✅ If both users deleted
        });

        res.json({ success: true, message: "Chat deleted successfully." });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ success: false, error: "Failed to delete chat." });
    }
});



//
app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select('firstName lastName email profilePic');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
//
app.delete('/api/delete-chat', async (req, res) => {
    const { userEmail, chatPartner } = req.body;

    if (!userEmail || !chatPartner) {
        return res.status(400).json({ message: "Invalid request parameters" });
    }

    try {
        // Mark messages as deleted for the user
        await Message.updateMany(
            { sender: userEmail, receiver: chatPartner },
            { $set: { deletedForUser: userEmail } }
        );

        await Message.updateMany(
            { sender: chatPartner, receiver: userEmail },
            { $set: { deletedForUser: userEmail } } // Mark as deleted for this user only
        );

        res.status(200).json({ message: "Chat removed from user’s view" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



const User = mongoose.model('User', userSchema);
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: " User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: " Invalid password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, "your_jwt_secret", { expiresIn: "1h" });

        res.status(200).json({ 
            message: "Login successful", 
            user,
            token
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: " Server error" });
    }
});


// Registration Route
app.post('/api/register', async (req, res) => {
    try {
        console.log("Received Data:", req.body); // Debugging Line

        const { firstName, lastName, email, password, genderType, bio, dob, streetAddress, state, city, district, pinCode ,terms} = req.body;

        if (!firstName || !lastName || !email || !password || !genderType || !dob || !streetAddress || !state || !city || !district || !pinCode || typeof terms === "undefined"){
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            genderType,
            bio,
            dob,
            streetAddress,
            state,
            city,
            district,
            pinCode,
            terms
        });

        // Save user to the database
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error" });
    }
});
const travelPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: String,
    startDate: Date,
    endDate: Date,
    duration: Number,
    companions: Number,
    description: String
}, { timestamps: true }); // This adds 'createdAt' and 'updatedAt'

// Create Travel Plan
app.post('/api/travel-plan', async (req, res) => {
    try {
        const { userId, destination, startDate, endDate, duration, companions, description } = req.body;

        if (!userId || !destination || !startDate || !endDate || !duration || !companions || !description) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newPlan = new TravelPlan({
            userId,
            destination,
            startDate,
            endDate,
            duration,
            companions,
            description
        });

        await newPlan.save();
        res.status(201).json({ message: 'Travel plan created successfully' });
    } catch (error) {
        console.error('Error creating travel plan:', error);
        res.status(500).json({ error: 'Failed to create travel plan' });
    }
});


const TravelPlan = mongoose.model('TravelPlan', travelPlanSchema);

app.post('/api/travel', async (req, res) => {
    try {
        const { destination, startDate, endDate } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const match = await TravelPlan.findOne({
            destination: destination,
            startDate: { $lte: end },
            endDate: { $gte: start }
        }).populate('userId', 'email'); //  Fetch user email only

        if (match) {
            const partnerDetails = {
                destination: match.destination,
                startDate: match.startDate,
                endDate: match.endDate,
                duration: match.duration,
                description: match.description,
                email: match.userId.email  // Include the email from populated user
            };

            res.status(200).json({
                success: true,
                message: "Travel partner found!",
                partnerDetails
            });
        } else {
            res.status(404).json({ success: false, message: " No matching partner found." });
        }
    } catch (error) {
        console.error(" Error finding partner:", error);
        res.status(500).json({ success: false, message: " Server error." });
    }
});

app.post('/api/get-partners', async (req, res) => {
    try {
        const { destination, startDate, endDate } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);

        //  Get all travel plans that overlap the date range
        const matches = await TravelPlan.find({
            destination: destination,
            startDate: { $lte: end },
            endDate: { $gte: start }
        }).populate('userId', 'firstName lastName email genderType bio');

        // Format each partner's details
        const partners = matches.map(match => ({
            destination: match.destination,
            startDate: match.startDate,
            endDate: match.endDate,
            duration: match.duration,
            description: match.description,
            email: match.userId.email,
            firstName: match.userId.firstName,
            lastName: match.userId.lastName,
            genderType: match.userId.genderType,
            bio: match.userId.bio
        }));

        res.status(200).json(partners);
    } catch (error) {
        console.error(" Error fetching partners:", error);
        res.status(500).json({ message: " Server error while getting partners." });
    }
});



app.delete('/api/user-plans/:planId', async (req, res) => {
    try {
        const planId = req.params.planId;
        await TravelPlan.findByIdAndDelete(planId);
        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ error: "Failed to delete plan" });
    }
});

app.get('/api/user-plans/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const plans = await TravelPlan.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(plans);
    } catch (error) {
        console.error("Error fetching travel plans:", error);
        res.status(500).json({ error: "Failed to fetch plans" });
    }
});

app.post('/api/travel', async (req, res) => {
    try {
        const { destination, startDate, endDate } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Search for a partner whose travel dates overlap
        const match = await TravelPlan.findOne({
            destination: destination,
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (match) {
            res.status(200).json({
                success: true,
                message: "Travel partner found!",
                partnerDetails: match
            });
        } else {
            res.status(404).json({ success: false, message: "No matching partner found." });
        }
    } catch (error) {
        console.error("Error finding partner:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});


app.get('/api/my-accepted-requests', async (req, res) => {
    const { userId } = req.query;

    try {
        const acceptedRequests = await Request.find({
            senderId: userId,
            status: 'accepted'
        }).lean();

        const result = [];

        for (const req of acceptedRequests) {
            const receiver = await User.findOne({ email: req.receiverEmail }).lean();
            const travelPlan = await TravelPlan.findOne({ userId: receiver._id }).lean();

            result.push({
                receiverEmail: req.receiverEmail,
                status: req.status,
                destination: travelPlan?.destination || 'N/A',
                date: travelPlan?.startDate || 'N/A',
                createdByUsername: `${receiver.firstName} ${receiver.lastName}`
            });
        }

        res.json(result);
    } catch (error) {
        console.error("Error fetching accepted requests:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// Start the Server
server.listen(port, () => console.log(` Server running on http://localhost:${port}`));
