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

let previousDocumentation = "";

// Function to clean and merge documentation chunks properly
function mergeDocumentationChunks(chunks) {
  if (!chunks || chunks.length === 0) return "";
  if (chunks.length === 1) return chunks[0];
  
  // Extract the first main heading from the first chunk (repository name heading)
  const firstHeadingMatch = chunks[0].match(/^# ([^\n]+)/);
  const firstHeading = firstHeadingMatch ? firstHeadingMatch[0] : null;
  
  // Process all chunks
  const processedChunks = chunks.map((chunk, index) => {
    if (index === 0) return chunk;
    
    // Remove any main headings and "continued" text from subsequent chunks
    return chunk
      .replace(/^# [^\n]+\n+/, '') // Remove main level headings
      .replace(/^## (?:Project|Repository) Documentation(?:\s*continued)?\s*\n+/i, '') // Remove section headings
      .replace(/^Documentation continued[.\s]*\n+/i, '') // Remove "documentation continued" text
      .replace(/^Continuing from previous section[.\s]*\n+/i, ''); // Remove continuation phrases
  });
  
  // Join and ensure no duplicate headlines or sections
  let result = processedChunks.join('\n\n');
  
  // Ensure the first heading is only used once
  if (firstHeading) {
    // Count occurrences of the main heading and remove duplicates
    const headingRegex = new RegExp(`^${firstHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm');
    const headingMatches = result.match(headingRegex) || [];
    
    if (headingMatches.length > 1) {
      result = result.replace(headingRegex, (match, offset) => {
        // Keep only the first occurrence
        return offset === result.indexOf(firstHeading) ? match : '';
      });
    }
  }
  
  return result;
}

// Improved system prompt that addresses all the issues
const getSystemPrompt = (repoName = '') => {
  return `Generate professional code documentation for ${repoName || 'this repository'} following these guidelines:

OUTPUT FORMAT:
- Use "${repoName || 'Repository Name'}" as the only level 1 heading
- No meta-language like "Here is documentation" or "This is a comprehensive guide"
- Avoid phrases like "Project Documentation" or "Documentation for [Project]"
- For empty repositories, respond only with "No code found in repository"
- Format API documentation using tables:

| Endpoint | Method | Request Body | Response | Description |
| -------- | ------ | ------------ | -------- | ----------- |
| /api/users | GET | None | {users: [...]} | Fetches users list |

DOCUMENTATION STRUCTURE:
1. Repository name (level 1 heading)
2. Brief overview based on actual code (not theoretical)
3. Installation/setup (if detectable)
4. Project architecture (key components and relationships)
5. API documentation with proper tables
6. Key files and modules with explanations
7. Dependencies

If client and server code are both present, document client code first completely, then server code.

When handling user modification requests, directly modify the documentation without explaining your role or capabilities.`;
};

app.post("/api/generate-doc", async (req, res) => {
  const { repoContent, userInput } = req.body;

  if (!repoContent && !userInput) {
    return res.status(400).json({ error: "No input provided." });
  }

  try {
    // Extract repository name if available
    let repoName = '';
    if (typeof repoContent === 'string' && repoContent.length > 0) {
      try {
        const parsed = JSON.parse(repoContent);
        if (parsed && parsed.repo) {
          repoName = parsed.repo;
        }
      } catch (e) {
        // Parsing failed, but we can continue without the repo name
      }
    }

    const systemMessage = {
      role: "system",
      content: getSystemPrompt(repoName)
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
        previousDocumentation = previousDocumentation + "\n\n" + newResponse;
        return res.json({ documentation: newResponse });
      } else if (userInput.trim().toLowerCase().includes("readme format")) {
        // Special handling for README format requests
        const userMessage = { 
          role: "user", 
          content: `Convert the previously generated documentation to a GitHub README.md format that looks good when rendered. Use proper markdown formatting, include badges if applicable, and ensure it is well-structured for GitHub rendering. Don't include any explanation about the conversion, just provide the README.md content directly:\n\n${previousDocumentation}` 
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
        const userMessage = { 
          role: "user", 
          content: `Apply this change to the documentation: "${userInput}"\n\nExisting documentation:\n${previousDocumentation}` 
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
      // Check if repo is empty
      let parsedContent;
      try {
        parsedContent = JSON.parse(repoContent);
        if (!parsedContent.files || parsedContent.files.length === 0) {
          return res.json({ documentation: "No code found in repository." });
        }
      } catch (error) {
        // Continue with string content if parsing fails
      }

      const contentSize = repoContent.length;
      const isLargeRepo = contentSize > 20000; // Reduced from 100000 to detect large repos earlier
      
      if (!isLargeRepo) {
        const userMessage = { 
          role: "user", 
          content: `Generate documentation for this repository content:\n\n${repoContent}` 
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
        let parsedContent;
        try {
          parsedContent = JSON.parse(repoContent);
        } catch (error) {
          return res.status(400).json({ error: "Invalid repository content format." });
        }

        const chunks = prepareChunks(parsedContent);
        const documentationChunks = [];
        
        // Limit the number of chunks to process to avoid context length issues
        const chunkLimit = Math.min(chunks.length, 50);
        const processingChunks = chunks.slice(0, chunkLimit);
        
        console.log(`Processing ${processingChunks.length} chunks out of ${chunks.length} total chunks`);
        
        // First chunk gets special treatment with project overview
        let firstChunkResponse = '';
        try {
          const chunk = processingChunks[0];
          const chunkContent = JSON.stringify(chunk);
          const trimmedChunk = chunkContent.length > 20000 ? 
            chunkContent.substring(0, 20000) + "..." : 
            chunkContent;

          const firstChunkPrompt = `Generate an overview, architecture, and introduction section for this repository using this content:\n\n${trimmedChunk}`;
          
          const firstChunkMessage = { role: "user", content: firstChunkPrompt };
          const firstChunkCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",  
            messages: [systemMessage, firstChunkMessage],
            max_tokens: 16000,
            temperature: 0.6,
          });
          
          firstChunkResponse = firstChunkCompletion.choices[0].message.content;
          documentationChunks.push(firstChunkResponse);
        } catch (error) {
          console.error("Error processing first chunk:", error);
          firstChunkResponse = `# ${repoName || 'Repository'}\n\n## Overview\n\nThis repository contains multiple files and directories.`;
          documentationChunks.push(firstChunkResponse);
        }
        
        // Group chunks by type for logical organization
        const clientChunks = processingChunks.filter(c => 
          c.directory && ['client', 'frontend', 'src/components', 'public'].includes(c.directory.toLowerCase())
        );
        
        const serverChunks = processingChunks.filter(c => 
          c.directory && ['server', 'backend', 'api', 'routes', 'controllers', 'models'].includes(c.directory.toLowerCase())
        );
        
        const otherChunks = processingChunks.filter(c => 
          !clientChunks.includes(c) && !serverChunks.includes(c) && c !== processingChunks[0]
        );
        
        // Process client chunks first
        if (clientChunks.length > 0) {
          const clientPrompt = `Generate documentation for the client/frontend part of the application. Focus on components, pages, and UI structure:\n\n${JSON.stringify(clientChunks)}`;
          
          try {
            const clientMessage = { role: "user", content: clientPrompt };
            const clientCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, clientMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            documentationChunks.push(clientCompletion.choices[0].message.content);
          } catch (error) {
            console.error("Error processing client chunks:", error);
          }
        }
        
        // Then process server chunks
        if (serverChunks.length > 0) {
          const serverPrompt = `Generate documentation for the server/backend part of the application. Focus on APIs, routes, controllers, and data models. Use tables for API endpoints:\n\n${JSON.stringify(serverChunks)}`;
          
          try {
            const serverMessage = { role: "user", content: serverPrompt };
            const serverCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, serverMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            documentationChunks.push(serverCompletion.choices[0].message.content);
          } catch (error) {
            console.error("Error processing server chunks:", error);
          }
        }
        
        // Process remaining chunks
        for (const chunk of otherChunks) {
          const chunkContent = JSON.stringify(chunk);
          const trimmedChunk = chunkContent.length > 20000 ? 
            chunkContent.substring(0, 20000) + "..." : 
            chunkContent;
          
          try {
            const chunkPrompt = `Document this part of the repository:\n\n${trimmedChunk}`;
            const chunkMessage = { role: "user", content: chunkPrompt };
            
            const chunkCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, chunkMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            documentationChunks.push(chunkCompletion.choices[0].message.content);
          } catch (error) {
            console.error(`Error processing chunk:`, error);
            continue;
          }
        }
        
        // Merge all documentation chunks
        const mergedDocumentation = mergeDocumentationChunks(documentationChunks);
        
        // Final refinement pass to ensure coherence
        if (documentationChunks.length > 1 && mergedDocumentation.length < 50000) {
          try {
            const refinementPrompt = `Polish and ensure coherence of this documentation. Remove any duplicated sections, fix transitions between sections, ensure consistent formatting throughout, and make sure API documentation uses tables:\n\n${mergedDocumentation}`;
            
            const refinementMessage = { role: "user", content: refinementPrompt };
            
            const refinementCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",  
              messages: [systemMessage, refinementMessage],
              max_tokens: 16000,
              temperature: 0.6,
            });
            
            previousDocumentation = refinementCompletion.choices[0].message.content;
          } catch (error) {
            console.error("Error during refinement:", error);
            previousDocumentation = mergedDocumentation;
          }
        } else {
          previousDocumentation = mergedDocumentation;
        }
        
        return res.json({ documentation: previousDocumentation });
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

// Improved chunking algorithm to categorize files by type
function prepareChunks(repoContent) {
  const chunks = [];
  const files = repoContent.files || [];
  const totalFiles = repoContent.totalFiles || files.length;
  
  // If no files are found, return an empty array
  if (files.length === 0) {
    return [];
  }
  
  // Create a concise overview for the first chunk
  const overview = {
    totalFiles,
    fileList: files.slice(0, 20).map(f => f.file),
    structure: analyzeStructure(files)
  };
  chunks.push(overview);
  
  // Separate files by type for better organization
  const clientFiles = files.filter(f => 
    f.file.includes('client/') || 
    f.file.includes('frontend/') || 
    f.file.includes('src/components/') ||
    f.file.includes('public/')
  );
  
  const serverFiles = files.filter(f => 
    f.file.includes('server/') || 
    f.file.includes('backend/') || 
    f.file.includes('api/') ||
    f.file.includes('routes/') ||
    f.file.includes('controllers/') ||
    f.file.includes('models/')
  );
  
  const otherFiles = files.filter(f => 
    !clientFiles.includes(f) && !serverFiles.includes(f)
  );
  
  // Chunk client files
  if (clientFiles.length > 0) {
    const fileGroups = groupFilesByDirectory(clientFiles);
    Object.keys(fileGroups).forEach(directory => {
      const dirFiles = fileGroups[directory];
      
      if (directory === "node_modules" || directory === ".git" || directory === "dist" || directory === "build") {
        return;
      }
      
      if (JSON.stringify(dirFiles).length > 8000) {
        const subChunks = splitArrayIntoChunks(dirFiles, 5);
        subChunks.forEach(subChunk => {
          chunks.push({
            directory,
            category: 'client',
            files: subChunk
          });
        });
      } else {
        chunks.push({
          directory,
          category: 'client',
          files: dirFiles
        });
      }
    });
  }
  
  // Chunk server files
  if (serverFiles.length > 0) {
    const fileGroups = groupFilesByDirectory(serverFiles);
    Object.keys(fileGroups).forEach(directory => {
      const dirFiles = fileGroups[directory];
      
      if (directory === "node_modules" || directory === ".git" || directory === "dist" || directory === "build") {
        return;
      }
      
      if (JSON.stringify(dirFiles).length > 8000) {
        const subChunks = splitArrayIntoChunks(dirFiles, 5);
        subChunks.forEach(subChunk => {
          chunks.push({
            directory,
            category: 'server',
            files: subChunk
          });
        });
      } else {
        chunks.push({
          directory,
          category: 'server',
          files: dirFiles
        });
      }
    });
  }
  
  // Chunk other files
  if (otherFiles.length > 0) {
    const fileGroups = groupFilesByDirectory(otherFiles);
    Object.keys(fileGroups).forEach(directory => {
      const dirFiles = fileGroups[directory];
      
      if (directory === "node_modules" || directory === ".git" || directory === "dist" || directory === "build") {
        return;
      }
      
      if (JSON.stringify(dirFiles).length > 8000) {
        const subChunks = splitArrayIntoChunks(dirFiles, 5);
        subChunks.forEach(subChunk => {
          chunks.push({
            directory,
            category: 'other',
            files: subChunk
          });
        });
      } else {
        chunks.push({
          directory,
          category: 'other',
          files: dirFiles
        });
      }
    });
  }
  
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