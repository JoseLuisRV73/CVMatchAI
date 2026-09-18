require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 3000;
const maxMb = Number(process.env.MAX_FILE_MB || 5);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ].includes(file.mimetype);
    cb(ok ? null : new Error("Solo se aceptan PDF o DOCX."), ok);
  }
});

function cleanText(text) {
  return String(text || "").replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    const data = await pdfParse(file.buffer);
    return cleanText(data.text);
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return cleanText(result.value);
}

function localFallback(cv, job) {
  const tokens = (s) => [...new Set(
    s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .match(/[a-záéíóúñ][a-záéíóúñ0-9+#.-]{2,}/gi) || []
  )];
  const stop = new Set(["para","con","del","las","los","una","uno","por","que","sus","como","este","esta","desde","sobre","entre","the","and","for","with","you","your","our","are","this","that","will","have"]);
  const cvT = new Set(tokens(cv).filter(x => !stop.has(x)));
  const jobT = tokens(job).filter(x => !stop.has(x));
  const unique = [...new Set(jobT)].slice(0, 40);
  const found = unique.filter(x => cvT.has(x));
  const missing = unique.filter(x => !cvT.has(x)).slice(0, 15);
  const keywordScore = unique.length ? Math.round(found.length / unique.length * 100) : 50;
  const score = Math.max(25, Math.min(95, Math.round(keywordScore * .55 + 60 * .45)));
  return {
    overall_score: score,
    ats_score: Math.min(98, score + 8),
    keyword_score: keywordScore,
    experience_score: 60,
    skills_score: keywordScore,
    education_score: 60,
    summary: "Análisis preliminar local. Conecta OpenAI para un análisis semántico completo.",
    strengths: found.slice(0, 8),
    gaps: missing,
    keywords_found: found,
    keywords_missing: missing,
    recommendations: [
      "Alinea el resumen profesional con el puesto objetivo.",
      "Demuestra logros con métricas cuando existan en tu experiencia.",
      "Usa términos de la oferta solo cuando estén respaldados por tu experiencia real.",
      "Mantén una estructura simple y legible para ATS."
    ],
    optimized_cv: cv
  };
}

const systemPrompt = `Eres CVMatch AI, un especialista senior en selección, ATS y optimización de CV.
Tu objetivo es comparar un CV con una oferta laboral concreta y producir recomendaciones útiles.
REGLA CRÍTICA: nunca inventes empleos, cargos, títulos, certificaciones, tecnologías, responsabilidades,
logros, métricas o experiencia. Si una keyword de la oferta no está respaldada por el CV, NO la agregues
como experiencia. Puedes sugerir al candidato que revise si realmente posee esa experiencia.
Devuelve exclusivamente JSON válido con esta estructura:
{
 "overall_score": number,
 "ats_score": number,
 "keyword_score": number,
 "experience_score": number,
 "skills_score": number,
 "education_score": number,
 "summary": string,
 "strengths": string[],
 "gaps": string[],
 "keywords_found": string[],
 "keywords_missing": string[],
 "recommendations": string[],
 "optimized_cv": string
}
El score debe ser consistente: keywords 30%, experiencia 25%, skills 20%, ATS/estructura 15%,
educación/certificaciones 10%. optimized_cv debe conservar todos los hechos verificables del CV
y mejorar redacción, orden y relevancia para la oferta.`;

app.post("/api/analyze", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Sube un CV en PDF o DOCX." });
    const job = cleanText(req.body.job);
    if (!job || job.length < 30) return res.status(400).json({ error: "Pega una oferta laboral suficientemente completa." });

    const cv = await extractText(req.file);
    if (!cv || cv.length < 50) return res.status(400).json({ error: "No se pudo extraer suficiente texto del CV." });

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "pega_aqui_tu_api_key") {
      return res.json(localFallback(cv, job));
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CV DEL CANDIDATO:\n${cv.slice(0, 30000)}\n\nOFERTA LABORAL:\n${job.slice(0, 20000)}` }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Error procesando el análisis." });
  }
});

app.post("/api/health", (req, res) => res.json({ ok: true, service: "CVMatch AI" }));

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Solicitud inválida." });
});

app.listen(port, "0.0.0.0", () => console.log(`CVMatch AI running on port ${port}`));
