const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const Razorpay = require("razorpay");
const passport = require("passport");
const { router: authRoutes } = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes");
const crypto = require("crypto");
const User = require("./models/User");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");
const esprima = require("esprima"); 
const router = express.Router();
const { rimraf } = require("rimraf");  
const axios = require("axios")
const messageRoutes = require("./routes/messages");
const OpenAI = require("openai");

const os = require("os");

setInterval(() => {
  console.log("Cleaning up old repos...");
  rimraf("/tmp/repos", (err) => {
    if (err) {
      console.error("Error deleting repos:", err);
    } else {
      fs.mkdirSync("/tmp/repos", { recursive: true }); 
      console.log("Old repos cleaned up and directory recreated.");
    }
  });
}, 24 * 60 * 60 * 1000);

require("./config/passport");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  cors({
    origin: ["http://localhost:3000", "https://www.docufyai.in"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "random_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.options("*", cors());

const TEMP_REPO_DIR = path.join(os.tmpdir(), "repos");
if (!fs.existsSync(TEMP_REPO_DIR)) {
  fs.mkdirSync(TEMP_REPO_DIR);
}

const deleteRepo = async (repoPath) => {
  try {
    if (fs.existsSync(repoPath)) {
      await rimraf(repoPath);   
    }
  } catch (err) {
    console.error("Error deleting repo:", err);
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  
});

// Function to merge documentation chunks properly and remove repetitive sections
function mergeDocumentationChunks(chunks) {
  if (!chunks || chunks.length === 0) return "";
  if (chunks.length === 1) return chunks[0];
  
  // Extract the first occurrence of "# Documentation" or similar headers
  const headerRegex = /^# Documentation\s*$/im;
  const architectureRegex = /^## Architecture Explanation\s*$/im;
  const headingRegexes = [
    /^# [^\n]+$/gim,                  // Match all H1 headings
    /^## [^\n]+$/gim,                 // Match all H2 headings
    /^### [^\n]+$/gim,                // Match all H3 headings
    /^Documentation\s*$/gim,          // Match "Documentation" without #
    /^Architecture Explanation\s*$/gim // Match "Architecture Explanation" without #
  ];
  const frontendBackendRegex = [
    /^# Frontend Documentation\s*$/im,
    /^# Backend Documentation\s*$/im,
    /^## Frontend Documentation\s*$/im,
    /^## Backend Documentation\s*$/im
  ];
  
  let mergedDoc = chunks[0];
  
  // Process each chunk after the first one
  for (let i = 1; i < chunks.length; i++) {
    let chunkContent = chunks[i];
    
    // Remove common headers that might be repeated
    if (headerRegex.test(mergedDoc)) {
      chunkContent = chunkContent.replace(headerRegex, '');
    }
    
    if (architectureRegex.test(mergedDoc)) {
      chunkContent = chunkContent.replace(architectureRegex, '');
    }

    frontendBackendRegex.forEach(regex => {
      chunkContent = chunkContent.replace(regex, '');
    });
    
    
    // Remove any continuation phrases or section indicators
    chunkContent = chunkContent.replace(/^Continuing from previous section\.?[\s\n]*/i, '');
    chunkContent = chunkContent.replace(/^Continuing the documentation\.?[\s\n]*/i, '');
    chunkContent = chunkContent.replace(/^Moving on to the next part\.?[\s\n]*/i, '');
    chunkContent = chunkContent.replace(/^Documentation continued[\s\n]*/i, '');
    chunkContent = chunkContent.replace(/^Part \d+:[\s\n]*/i, '');
    
    // Check for duplicate headings
    for (const regex of headingRegexes) {
      const headingsInMerged = mergedDoc.match(regex) || [];
      
      if (headingsInMerged.length > 0) {
        // For each heading already in the merged document, remove the same heading from the current chunk
        headingsInMerged.forEach(heading => {
          const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const dupeRegex = new RegExp(`^${escapedHeading}\\s*$`, 'im');
          chunkContent = chunkContent.replace(dupeRegex, '');
        });
      }
    }
    
    // Append the cleaned chunk content
    mergedDoc += '\n\n' + chunkContent.trim();
  }
  
  // Perform a final cleanup to remove any doubled-up newlines
  mergedDoc = mergedDoc.replace(/\n{3,}/g, '\n\n');
  
  return mergedDoc;
}

let previousDocumentation = "";

app.post("/api/generate-doc", async (req, res) => {
  const { repoContent, userInput } = req.body;

  if (!repoContent && !userInput) {
    return res.status(400).json({ error: "No input provided." });
  }

  try {
    const systemMessage = {
      role: "system",
      content: `You are DocufyAi, a professional documentation generator. Follow these EXACT instructions:
    
    1. For initial repository analysis, generate PROFESSIONAL, ENTERPRISE-GRADE comprehensive documentation that would be acceptable at companies like Google or Microsoft.

    2. NEVER respond with "No code found in repository" unless the repository is completely empty, if empty then respond.
    
    3. Documentation must include:
       - Project Structure in diagram form
       - Detailed function explanations with parameters, return values, and examples
       - Complete code flow analysis showing how data moves through the application
       - Architecture diagrams 
       - Proper technical specifications
       - Tables for structured data where appropriate
       - Dont include and introduction and conclusion and title heading of the documentation should only be Documentation in h1 .
    
    4. If both frontend and backend code exist:
       - First give full frontend documentation then give full backend dont give if it exist and vice versa.
       - For frontend: document components, state management, UI flow, and user interactions
       - For backend: document services, controllers, models, and data flow
    
    5. Important: For API documentation dont give that in table and, include:
       - Base URL/endpoint
       - HTTP method
       - Request headers
       - Request body format with examples
       - URL parameters
       - Query parameters
       - Response format with status codes and examples
       - Error handling
       - Authentication requirements
       - Rate limiting information (if applicable)
       - Use markdown tables for clarity
    
    6. CRITICAL: For ALL subsequent user messages after documentation has been generated, make MINIMAL MODIFICATIONS to the existing documentation based on the user's request.
    
    7. NEVER respond with "I am DocufyAi, designed for documentation-related tasks..." or similar phrases.
    
    8. If asked to provide more details, expand only the specific section mentioned.
    
    9. IMPORTANT: Always keep the entire existing documentation structure and content intact, making only the specific changes requested by the user.
    
    10. If you cannot perform the specific modification, return the previous documentation completely unchanged.
    
    11. Do not create completely new documentation in response to a modification request - start with the existing documentation and make minimal targeted changes.`
    };
    if (userInput) {
      if (userInput.trim().toLowerCase() === "continue") {
        if (!previousDocumentation) {
          return res.status(400).json({ error: "No previous documentation found to continue." });
        }
        const userMessage = { 
          role: "user", 
          content: `Continue from where you left off:\n\n${previousDocumentation}` 
        };
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",  
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;
        previousDocumentation = newResponse;
        return res.json({ documentation: newResponse });
      } else {
        // Include the previous documentation directly in the message
        const userMessage = { 
          role: "user", 
          content: `Here is the existing documentation:\n\n${previousDocumentation}\n\nModify this existing documentation as per the following request: "${userInput}"\n\nMake only the minimal required changes to address the request while keeping the overall structure and information intact.` 
        };
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",  
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;
        previousDocumentation = newResponse;
        return res.json({ documentation: newResponse });
      }
    }
    if (repoContent) {
      const contentSize = repoContent.length;
      const isLargeRepo = contentSize > 40000; // Reduced from 100000 to detect large repos earlier
      
      if (!isLargeRepo) {
        const userMessage = { 
          role: "user", 
          content: `Analyze the following repository content and generate structured documentation, including explanations, APIs (if present), and usage details:\n\n${repoContent}` 
        };
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",  
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;
        previousDocumentation = newResponse;
        return res.json({ documentation: newResponse });
      } 
      
      else {
        let parsedContent;
        try {
          parsedContent = JSON.parse(repoContent);
        } catch (error) {
          return res.status(400).json({ error: "Invalid repository content format." });
        }

        const chunks = prepareChunks(parsedContent);
        const chunkResponses = []; // Store individual chunk responses
        let contextSummary = "";
        
        // Limit the number of chunks to process to avoid context length issues
        const chunkLimit = Math.min(chunks.length, 50);
        const processingChunks = chunks.slice(0, chunkLimit);
        
        console.log(`Processing ${processingChunks.length} chunks out of ${chunks.length} total chunks`);
        
        for (let i = 0; i < processingChunks.length; i++) {
          const chunk = processingChunks[i];
          const isFirstChunk = i === 0;
          const isLastChunk = i === processingChunks.length - 1;
          
          // Trim chunk content for safety
          const chunkContent = JSON.stringify(chunk);
          // Limit chunk size to avoid context length issues
          const trimmedChunk = chunkContent.length > 40000 ? 
            chunkContent.substring(0, 40000) + "..." : 
            chunkContent;
          
            let chunkPrompt;
            if (isFirstChunk) {
              chunkPrompt = `This is a large repository, so I'll analyze it in parts. 
          
          CRITICAL INSTRUCTION: DO NOT REPEAT ANY INFORMATION FROM PREVIOUS DOCUMENTATION CHUNKS. 
          If you find you're about to write something similar to previously generated content, 
          REFER TO THE PREVIOUS CONTENT INSTEAD OF REWRITING IT.
          
          Focus on creating an introduction, overview, and architecture explanation based on the following repository content:\n\n${trimmedChunk}`;
            } else if (isLastChunk) {
              chunkPrompt = `This is the final part of the repository. 
          
          CRITICAL INSTRUCTION: DO NOT REPEAT ANY INFORMATION FROM PREVIOUS DOCUMENTATION CHUNKS. 
          If you find you're about to write something similar to previously generated content, 
          REFER TO THE PREVIOUS CONTENT INSTEAD OF REWRITING IT.
          
          Based on this content and considering the previous parts (context: ${contextSummary}), 
          complete the documentation with any remaining details and a conclusion:\n\n${trimmedChunk}`;
            } else {
              chunkPrompt = `This is part ${i+1} of the repository analysis. 
          
          CRITICAL INSTRUCTION: DO NOT REPEAT ANY INFORMATION FROM PREVIOUS DOCUMENTATION CHUNKS. 
          If you find you're about to write something similar to previously generated content, 
          REFER TO THE PREVIOUS CONTENT INSTEAD OF REWRITING IT.
          
          Using the previous context (${contextSummary}) as a foundation, 
          continue the documentation by analyzing the following content:\n\n${trimmedChunk}`;
            }
          
          const chunkMessage = { role: "user", content: chunkPrompt };
          
          try {
            const chunkCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, chunkMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            const chunkResponse = chunkCompletion.choices[0].message.content;
            chunkResponses.push(chunkResponse); // Store individual responses
            
            // Create a shorter context summary
            contextSummary = chunkResponse.slice(0, 200) + "...";
          } catch (error) {
            console.error(`Error processing chunk ${i}:`, error);
            // Continue with next chunk on error
            continue;
          }
        }

        // Merge the chunk responses using our new function
        let fullDocumentation = mergeDocumentationChunks(chunkResponses);

        // Only do the refinement if we have a reasonable amount of documentation
        if (processingChunks.length > 1 && fullDocumentation.length < 50000) {
          try {
            const refinementPrompt = `Carefully review this documentation and address the following critical requirements:

1. Completely eliminate ALL repetitive sections and redundant content
2. Ensure each piece of information appears ONLY ONCE in the document
3. If similar content exists across different sections, consolidate them intelligently
4. Maintain a clear, logical flow of information
5. Preserve ALL unique details from the original documentation
6. Create a cohesive document that reads as a single, professional technical document
7. Clearly separate frontend and backend documentation if both exist
8. Ensure API documentation is comprehensive and uses consistent formatting

Specific instructions for refinement:
- Remove duplicate explanations
- Combine similar sections without losing any unique information
- Restructure content to eliminate redundancy while maintaining comprehensive coverage

Original documentation to refine:\n\n${fullDocumentation}`;
            
            const refinementMessage = { role: "user", content: refinementPrompt };
            
            const refinementCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, refinementMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            fullDocumentation = refinementCompletion.choices[0].message.content;
          } catch (error) {
            console.error("Error during refinement:", error);
            // Continue with the unrefined documentation if refinement fails
          }
        }
        
        previousDocumentation = fullDocumentation;
        return res.json({ documentation: fullDocumentation });
      }
    }
  } catch (error) {
    console.error("Error calling GPT API:", error);

    if (error.response) {
      console.error("OpenAI error response:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    res.status(500).json({ error: "Failed to generate documentation" });
  }
});

function prepareChunks(repoContent) {
  const chunks = [];
  const files = repoContent.files || [];
  const totalFiles = repoContent.totalFiles || files.length;
  
  // Create a more concise overview
  const overview = {
    totalFiles,
    // Only include first 20 files in the overview to reduce size
    fileList: files.slice(0, 20).map(f => f.file),
    structure: analyzeStructure(files)
  };
  chunks.push(overview);
  
  const fileGroups = groupFilesByDirectory(files);
  
  Object.keys(fileGroups).forEach(directory => {
    const dirFiles = fileGroups[directory];
    
    // Skip large unimportant directories
    if (directory === "node_modules" || directory === ".git" || directory === "dist" || directory === "build" || directory === "README.md") {
      return;
    }
    
    if (JSON.stringify(dirFiles).length > 8000) { // Reduced from 16000 to 8000 for smaller chunks
      const subChunks = splitArrayIntoChunks(dirFiles, 5); // Split into more chunks (was 3)
      subChunks.forEach(subChunk => {
        chunks.push({
          directory,
          files: subChunk
        });
      });
    } else {
      chunks.push({
        directory,
        files: dirFiles
      });
    }
  });
  
  return chunks;
}

function analyzeStructure(files) {
  const extensions = {};
  const directories = {};
  
  files.forEach(file => {
    const ext = file.file.split('.').pop();
    if (ext) {
      extensions[ext] = (extensions[ext] || 0) + 1;
    }
    
    const dir = file.file.split('/')[0];
    if (dir) {
      directories[dir] = (directories[dir] || 0) + 1;
    }
  });
  
  return { extensions, directories };
}

function groupFilesByDirectory(files) {
  const groups = {};
  
  files.forEach(file => {
    const parts = file.file.split('/');
    const directory = parts.length > 1 ? parts[0] : 'root';
    
    if (!groups[directory]) {
      groups[directory] = [];
    }
    groups[directory].push(file);
  });
  
  return groups;
}

function splitArrayIntoChunks(array, numChunks) {
  const result = [];
  const chunkSize = Math.ceil(array.length / numChunks);
  
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  
  return result;
}

setInterval(async () => {
  console.log("Cleaning up old repos...");
  try {
    await rimraf(TEMP_REPO_DIR); 
    fs.mkdirSync(TEMP_REPO_DIR, { recursive: true }); 
    console.log("Old repos cleaned successfully.");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}, 24 * 60 * 60 * 1000);

const cloneRepo = async (repoUrl, repoPath) => {
  try {
    await deleteRepo(repoPath); 

    return new Promise((resolve, reject) => {
      exec(
        `GIT_ASKPASS=echo git clone --depth=1 ${repoUrl} ${repoPath}`,
        { env: { GIT_ASKPASS: "echo", GIT_TERMINAL_PROMPT: "0" } },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Git Clone Error:", error.message);
            console.error("Git Clone Stderr:", stderr);
            return reject(new Error("Failed to clone repository"));
          }
          resolve();
        }
      );
    });
  } catch (error) {
    console.error("Error in cloneRepo:", error);
    throw error;
  }
};

const PaymentSchema = new mongoose.Schema({
  paymentId: String,
  orderId: String,
  signature: String,
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", PaymentSchema);

const OrderSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  currency: String,
  status: { type: String, default: "pending" },
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await new Order({ orderId: order.id, amount, currency }).save();

    res.json({ orderId: order.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating order");
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId, plan } = req.body;

    const order = await Order.findOne({ orderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const secret = process.env.RAZORPAY_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: "paid" },
      { new: true }
    );

    const newPayment = new Payment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      amount: order.amount / 100, 
    });

    await newPayment.save();

    if (userId) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const updatedPlan = plan === "Enterprise Plan" ? "Enterprise Plan (₹1,499/month)" : "Pro Plan (₹499/month)";

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { currentPlan: updatedPlan, planExpiry: expiryDate },
        { new: true }
      );
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (error) {
    console.error("Payment verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
});

const resetExpiredPlans = async () => {
  try {
    const now = new Date();
    const users = await User.find({
      planExpiry: { $lte: now },
    });

    for (const user of users) {
      user.currentPlan = "Free Plan (₹0/month)";
      user.planExpiry = null;
      await user.save();
      console.log(`Reset plan for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error resetting expired plans:", error);
  }
};

setInterval(resetExpiredPlans, 24 * 60 * 60 * 1000); 

app.get("/get-razorpay-key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post("/api/github/clone", async (req, res) => {
  const { repoName, githubToken, username } = req.body;

  if (!repoName || !githubToken || !username) {
    return res.status(400).json({ error: "Missing required details" });
  }

  try {
    const repoUrl = `https://${githubToken}@github.com/${username}/${repoName}.git`;
    const repoPath = path.join(TEMP_REPO_DIR, repoName);

    await cloneRepo(repoUrl, repoPath);
    const analysis = analyzeRepo(repoPath);

    res.json({ success: true, repo: repoName, analysis });

    setTimeout(async () => {
      try {
        await rimraf(repoPath);
        console.log(`Deleted repo: ${repoPath}`);
      } catch (err) {
        console.error("Error deleting repo:", err);
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: "Repository import failed. Only repositories owned or created by you can be imported.",
      errorDetails: [
        "Only repositories owned or created by you can be imported",
        "Repository doesn't contain code files (documentation works only for code repositories)",
        "Repository contains extremely large files or ML models that exceed size limits"
      ]
    });
  }
});

const analyzeRepo = (repoPath) => {
  let fileStructure = [];
  const supportedExtensions = [
    "js", "jsx", "ts", "tsx", "html", "css", "scss", "json", "md", "yaml", "yml",
    "xml", "toml", "env", "sh", "bat", "ps1", "ini", "conf", "txt", "log",
    "py", "java", "kt", "kts", "go", "rs", "rb", "swift", "php", "cpp", "h", "hpp", "c",
    "cs", "r", "dart", "lua", "pl", "sql", "jsx", "tsx", "vue", "dockerfile", "makefile"
  ];

  // Maximum file size to include (100KB)
  const MAX_FILE_SIZE = 100 * 1024;

  const readFiles = (dir, relativePath = "") => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const relFilePath = path.join(relativePath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Skip node_modules and other large directories
        if (file === "node_modules" || file === ".git" || file === "dist" || file === "build") {
          return;
        }
        readFiles(filePath, relFilePath);
      } else if (supportedExtensions.includes(path.extname(file).slice(1))) {
        if (stats.size <= MAX_FILE_SIZE) {
          const content = fs.readFileSync(filePath, "utf-8");
          fileStructure.push({ file: relFilePath, content });
        } else {
          // For large files, only include the first part
          const content = fs.readFileSync(filePath, { 
            encoding: 'utf-8', 
            start: 0, 
            end: Math.min(stats.size, MAX_FILE_SIZE - 1) 
          });
          fileStructure.push({ 
            file: relFilePath, 
            content: content + "\n\n[File truncated due to size...]"
          });
        }
      }
    });
  };

  readFiles(repoPath);
  return { totalFiles: fileStructure.length, files: fileStructure };
};

app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

app.use("/api/messages", messageRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/github", authRoutes);
app.use("/api/user", userRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // ❌ Commented out keepAlive because we are using an external service (Cron-job.org)
  /*
  const keepAlive = () => {
    axios.get(`https://sooru-ai.onrender.com/api/ping`)
      .then(() => console.log("Keep-alive ping successful"))
      .catch(error => console.error("Keep-alive ping failed:", error.message));
  };

  // Initial ping when server is fully running
  keepAlive();

  // Set up interval (30 minutes)
  setInterval(keepAlive, 1800000);
  */

  // ✅ No need for self-ping anymore. Using Cron-job.org instead.
});