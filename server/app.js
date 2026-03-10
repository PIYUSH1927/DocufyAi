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
let documentationStore = {};

// Modified prepareChunks function to improve directory structure preservation
function prepareChunks(repoContent) {
  const chunks = [];
  const files = repoContent.files || [];
  const totalFiles = repoContent.totalFiles || files.length;

  // Filter out unwanted files
  const filteredFiles = files.filter(file => {
    const fileName = file.file.toLowerCase();
    const ignoredPatterns = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      'manifest.json',
      'robots.txt',
      'index.html',
      '.ico',
      'readme.md',
      'sitemap.xml',
      '.gitignore',
      'license',
      'bootstrap.min.css',
      'bootstrap.css',
      '_bootstrap',
      'bootstrap-grid.css',
      'bootstrap-reboot.css',
      'bootstrap-theme.css',

      // CSS files - only skip content, keep file references
      fileName.endsWith('.css')
    ];

    return !ignoredPatterns.some(pattern =>
      fileName.includes(pattern)
    );
  });

  // Modify files to remove CSS content while keeping references
  const processedFiles = filteredFiles.map(file => {
    if (file.file.toLowerCase().endsWith('.css')) {
      return {
        file: file.file,
        content: `// CSS file: ${file.file}`
      };
    }
    return file;
  });

  const configSetupFiles = processedFiles.filter(file => {
    const fileName = file.file.toLowerCase();
    return fileName.includes('package.json') ||
      fileName.includes('.env') ||
      fileName.includes('readme') ||
      fileName.includes('config') ||
      fileName.endsWith('.config.js') ||
      fileName.includes('setup') ||
      fileName.includes('install');
  });

  // If we found any setup files, create a dedicated chunk for them
  if (configSetupFiles.length > 0) {
    chunks.push({
      directory: 'setup',
      files: configSetupFiles,
      type: 'configuration'
    });
  }


  // Create a more concise overview
  const overview = {
    totalFiles: processedFiles.length,
    // Include all files in the overview to ensure full coverage
    fileList: processedFiles.map(f => f.file),
    structure: analyzeStructure(processedFiles)
  };
  chunks.push(overview);

  // Group files by their full directory path to preserve structure
  const fileGroups = groupFilesByFullPath(processedFiles);

  Object.keys(fileGroups).forEach(directory => {
    const dirFiles = fileGroups[directory];

    // Skip large unimportant directories
    if (directory === "node_modules" || directory === ".git" || directory === "dist" || directory === "build" || directory === "README.md") {
      return;
    }

    if (JSON.stringify(dirFiles).length > 16000) { // Reduced from 16000 to 8000 for smaller chunks
      // Create smaller chunks with logical grouping of related files
      const subChunks = createLogicalChunks(dirFiles, directory, 5);
      subChunks.forEach(subChunk => {
        chunks.push({
          directory,
          files: subChunk.files,
          type: subChunk.type || 'general'
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

// Group files by their full directory path
function groupFilesByFullPath(files) {
  const groups = {};

  files.forEach(file => {
    const filePath = file.file;
    const parts = filePath.split('/');

    let directoryPath;
    if (parts.length === 1) {
      directoryPath = 'root'; // Root files
    } else {
      // Use full directory path
      directoryPath = parts.slice(0, -1).join('/');
    }

    if (!groups[directoryPath]) {
      groups[directoryPath] = [];
    }
    groups[directoryPath].push(file);
  });

  return groups;
}

// Create logical chunks by grouping related files together
function createLogicalChunks(files, directory, maxChunks) {
  // Sort files by type and name to keep related files together
  const sortedFiles = [...files].sort((a, b) => {
    // Keep index files first
    if (a.file.includes('index') && !b.file.includes('index')) return -1;
    if (!a.file.includes('index') && b.file.includes('index')) return 1;

    // Group by file type
    const aExt = a.file.split('.').pop();
    const bExt = b.file.split('.').pop();
    if (aExt !== bExt) return aExt.localeCompare(bExt);

    // Then by name
    return a.file.localeCompare(b.file);
  });

  // Classify files into types
  const fileTypes = {
    config: [],
    components: [],
    pages: [],
    utils: [],
    hooks: [],
    contexts: [],
    tests: [],
    other: []
  };

  sortedFiles.forEach(file => {
    const fileName = file.file.toLowerCase();

    if (fileName.includes('component') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.tsx') ||
      /[A-Z][a-z]+\.(jsx|tsx|js|ts)$/.test(fileName)) {
      fileTypes.components.push(file);
    } else if (fileName.includes('page') || fileName.includes('/pages/')) {
      fileTypes.pages.push(file);
    } else if (fileName.includes('util') || fileName.includes('helper')) {
      fileTypes.utils.push(file);
    } else if (fileName.includes('hook') || fileName.startsWith('use')) {
      fileTypes.hooks.push(file);
    } else if (fileName.includes('context') || fileName.includes('provider')) {
      fileTypes.contexts.push(file);
    } else if (fileName.includes('test') || fileName.includes('spec')) {
      fileTypes.tests.push(file);
    } else {
      fileTypes.other.push(file);
    }
  });

  // Create chunks based on logical file groupings
  const chunks = [];
  Object.entries(fileTypes).forEach(([type, typeFiles]) => {
    if (typeFiles.length === 0) return;

    if (typeFiles.length > 20) {
      // Split large categories into smaller chunks
      const chunkSize = Math.ceil(typeFiles.length / Math.min(3, maxChunks));
      for (let i = 0; i < typeFiles.length; i += chunkSize) {
        chunks.push({
          type,
          files: typeFiles.slice(i, i + chunkSize)
        });
      }
    } else {
      chunks.push({
        type,
        files: typeFiles
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

app.post("/api/generate-doc", async (req, res) => {
  const { repoContent, userInput, userId, repoName } = req.body;

  if (!repoContent && !userInput) {
    return res.status(400).json({ error: "No input provided." });
  }

  const chatId = userId && repoName ? `${userId}_${repoName}` : null;

  try {
    const systemMessage = {
      role: "system",
      content: `You are DocufyAi, an expert API documentation engineer. Your sole purpose is to produce industry-standard, professional API reference documentation — the kind shipped by Stripe, Twilio, and AWS.

## PRIMARY OBJECTIVE
Analyze the supplied repository and produce a complete, production-grade API Reference document.

## DOCUMENT STRUCTURE (always follow this exact order)

# API Documentation

### Overview
One concise paragraph: what this service does, its primary purpose, and target consumers.

### Base URL
\`\`\`
https://api.example.com/v1
\`\`\`
If multiple environments exist (dev / staging / prod), list all.

### Authentication
Explain the auth mechanism (Bearer token / API key / OAuth2 / session cookie / etc.), where credentials go (header / query param), and show a concrete example request header.

### Request & Response Format
Default content types, date formats, pagination conventions, and any envelope wrapper pattern.

### Error Codes
A markdown table covering every HTTP status the API returns:
| Status | Code | Meaning |
|--------|---------|---------|
| 400 | VALIDATION_ERROR | ... |

### Rate Limiting
Limits, window size, relevant headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After). If not determinable, state "Not specified in source".

### Endpoints
For EVERY route/controller found, produce a subsection:

#### [HTTP METHOD] /path/to/endpoint
**Summary:** One-line description.
**Auth required:** Yes / No

**Path Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|

**Query Parameters**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|

**Request Headers**
| Header | Value |
|--------|-------|
| Authorization | Bearer <token> |

**Request Body** (if applicable — show JSON schema + example)
\`\`\`json
{
  "field": "value"
}
\`\`\`

**Responses**
| Status | Description |
|--------|-------------|
| 200 | Success |
| 4xx | Error |

**Success Response Example**
\`\`\`json
{ "id": "...", "status": "ok" }
\`\`\`

**Error Response Example**
\`\`\`json
{ "error": "VALIDATION_ERROR", "message": "..." }
\`\`\`

---

## RULES — READ CAREFULLY

1. **API-First**: The document is EXCLUSIVELY an API reference. Do NOT explain internal implementation details, classes, or utilities unless they directly affect the API contract.

2. **No-API repositories**: If the codebase contains NO API routes (e.g., pure frontend, CLI tool, library), output:
   > ⚠️ **No API endpoints detected.**
   > This repository does not expose HTTP API endpoints. It appears to be a [frontend app / CLI tool / library / etc.].
   > [2–3 sentences describing what it actually is and its main purpose.]
   Do NOT fabricate endpoints.

3. **Full-stack repositories**: Document the backend API completely. At the very end, add a single brief section:
   ### Frontend
   > [1–2 sentences only: framework used and what it consumes from this API. No component-level detail.]

4. **Completeness**: Document EVERY route, controller, and middleware that affects request handling. Do not skip endpoints.

5. **Accuracy over inference**: If a field, behaviour, or limit cannot be determined from the source, write "Not specified in source" — never invent values.

6. **Formatting**: Use GitHub-flavored Markdown. Code blocks must have language tags. Tables must be properly aligned. No trailing whitespace.

7. **Title rule**: The H1 heading must be exactly: # API Documentation — no project name prefix, no date.

8. **No filler**: Do not include an introduction paragraph about yourself, disclaimers, or generic statements like "This document will help developers…".

## FOR FOLLOW-UP USER MESSAGES (chat refinement)
When the user asks to modify the existing documentation:
- Apply only the minimal targeted change requested.
- Keep the entire document structure intact.
- Never regenerate the whole document unless explicitly asked.
- If the requested change cannot be applied, return the document unchanged.`
    };

    const previousDoc = chatId ? documentationStore[chatId] : null;

    if (userInput) {
      if (userInput.trim().toLowerCase() === "continue") {
        if (!previousDoc) {
          return res.status(400).json({ error: "No previous documentation found to continue." });
        }
        const userMessage = {
          role: "user",
          content: `Continue from where you left off:\n\n${previousDoc}`
        };

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;

        if (chatId) {
          documentationStore[chatId] = newResponse;
        }

        return res.json({ documentation: newResponse });
      } else {
        const userMessage = {
          role: "user",
          content: `Here is the existing documentation:\n\n${previousDoc || ""}\n\nModify this existing documentation as per the following request: "${userInput}"\n\nMake only the minimal required changes to address the request while keeping the overall structure and information intact.`
        };

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;

        if (chatId) {
          documentationStore[chatId] = newResponse;
        }

        return res.json({ documentation: newResponse });
      }
    }
    if (repoContent) {
      const contentSize = repoContent.length;
      const isLargeRepo = contentSize > 60000; // Reduced from 100000 to detect large repos earlier

      if (!isLargeRepo) {
        const userMessage = {
          role: "user",
          content: `Analyze the following repository and produce a complete, professional API Reference document.

Follow the document structure and all rules defined in your system instructions exactly.

Key priorities:
1. Identify every HTTP route/endpoint in the codebase — Express routes, Django urls, Spring controllers, FastAPI decorators, etc.
2. For each endpoint document: HTTP method, full path, auth requirement, all parameters (path/query/body), request/response schemas with JSON examples, and all possible status codes.
3. Infer base URL from environment config, README, or deployment files if present.
4. Identify the authentication strategy (JWT, session, API key, OAuth) and document it fully.
5. If no API endpoints exist, follow the no-API rule from your instructions.
6. If full-stack, add the brief Frontend section at the end only.

Repository content:\n\n${repoContent}`
        };

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [systemMessage, userMessage],
          max_tokens: 16000,
          temperature: 0.6,
        });

        const newResponse = completion.choices[0].message.content;

        if (chatId) {
          documentationStore[chatId] = newResponse;
        }

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
        const chunkLimit = Math.min(chunks.length, 80); // Increased from 50 to 80
        const processingChunks = chunks.slice(0, chunkLimit);

        console.log(`Processing ${processingChunks.length} chunks out of ${chunks.length} total chunks`);

        // First pass: Process all chunks with enhanced context about the repository structure
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
            chunkPrompt = `This is a large repository being analyzed in sequential chunks to build a complete API Reference document.

CHUNK 1 OF ${processingChunks.length} — FOUNDATION PASS
From this chunk, extract and document:
- Base URL (from .env, config files, README, or server bootstrap code)
- Authentication mechanism (JWT, session, API key, OAuth — document headers/tokens required)
- Global middleware that affects all requests (CORS, rate limiting, auth guards)
- Any global error handling conventions
- Any API versioning strategy
- Begin documenting any endpoints found in this chunk using the full endpoint format from your system instructions

DO NOT write a conclusion or summary — more chunks follow.
DO NOT repeat section headers that will be continued in later chunks.

Chunk content:\n\n${trimmedChunk}`;
          } else if (isLastChunk) {
            chunkPrompt = `FINAL CHUNK (${i + 1} of ${processingChunks.length}) — COMPLETE THE API REFERENCE

Context from previous chunks: ${contextSummary}

From this final chunk:
1. Document all remaining API endpoints found here (using full endpoint format)
2. Document any remaining error codes, rate limit headers, or response schemas not yet covered
3. If the codebase is full-stack, add the brief 1–2 line Frontend section at the very end
4. DO NOT repeat any endpoint or section already documented in previous chunks
5. DO NOT add a generic conclusion paragraph

Chunk content:\n\n${trimmedChunk}`;
          } else {
            chunkPrompt = `CHUNK ${i + 1} of ${processingChunks.length} — CONTINUE API REFERENCE

Context from previous chunks: ${contextSummary}

From this chunk, extract and document:
- All API endpoints (routes, controllers, handlers) found in these files
- For each endpoint: HTTP method, full path, auth requirement, parameters, request/response schema with JSON examples, status codes
- Any new middleware, guards, or decorators that affect specific routes
- Any new error types or response patterns not yet documented

DO NOT repeat anything already covered in previous chunks.
DO NOT write section headers that duplicate prior output.
DO NOT add filler text between endpoints.

Chunk content:\n\n${trimmedChunk}`;
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
            const refinementPrompt = `You have been given a draft API Reference document assembled from multiple analysis chunks. Refine it into a single, polished, production-grade API reference.

REFINEMENT RULES — apply all of these:

1. **Structure enforcement**: The final document must follow this exact order:
   # API Documentation
   - Overview
   - Base URL
   - Authentication
   - Request & Response Format
   - Error Codes (consolidated table)
   - Rate Limiting
   - Endpoints (one subsection per endpoint, grouped by resource/tag)
   - Frontend (only if full-stack — 1–2 lines max)

2. **Deduplication**: If the same endpoint appears more than once, merge into one canonical entry keeping all unique details.

3. **Endpoint completeness**: Every endpoint entry must have: HTTP method, path, auth requirement, parameter tables, request body schema with JSON example, response table with status codes, success + error JSON examples.

4. **Consistency**: Ensure all tables use the same column headers. All JSON examples use 2-space indentation. All code blocks have language tags.

5. **Purge non-API content**: Remove any paragraphs explaining internal function logic, class hierarchies, or component trees — unless directly relevant to the API contract.

6. **No filler**: Remove introductory sentences like "This document covers…", closing remarks, or any generic statements.

7. **Frontend rule**: If full-stack, the Frontend section must be a single blockquote of 1–2 sentences only — no component docs.

8. **No-API rule**: If no endpoints were found throughout all chunks, replace the entire document with the no-API notice format from the system instructions.

9. **Accuracy**: Do not add, invent, or assume any endpoint, parameter, or behavior not evidenced in the draft.

Draft API documentation to refine:\n\n${fullDocumentation}`;

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

        if (chatId) {
          documentationStore[chatId] = fullDocumentation;
        }
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
    "cs", "r", "dart", "lua", "pl", "sql", "jsx", "tsx", "vue", "dockerfile", "makefile", "ejs"
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
