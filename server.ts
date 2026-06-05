import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Helper to get GoogleGenAI client (Lazy-loaded to prevent start-up crash if key is missing)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment secrets.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Full-stack API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY")
  });
});

// AI Flashcard Generation route (Spaced repetition tailored academic cards in Arabic only)
app.post("/api/generate-cards", async (req, res) => {
  try {
    const { topic, count = 5, contextText = "" } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "عنوان الموضوع الدراسي مطلوب للتوليد." });
    }

    const ai = getGenAI();

    const limitCount = Math.min(Math.max(Number(count) || 5, 2), 12);

    const userPrompt = contextText 
      ? `قم بتوليد عدد ${limitCount} من البطاقات التعليمية الأكاديمية بناءً على الملاحظات التالية حول الموضوع "${topic}":\n\n${contextText}`
      : `قم بتوليد عدد ${limitCount} من البطاقات التعليمية المخصصة للمذاكرة والتمكن حول الموضوع التالي: "${topic}".`;

    const systemPrompt = `أنت معلم أكاديمي متميز وخبير في كتابة البطاقات التعليمية وصياغة الأسئلة والأجوبة بنظام التكرار المتباعد لطلاب المدارس والجامعات.
يجب أن تصيغ كل بطاقة باللغة العربية الفصحى البليغة والواضحة تماماً وبدون استخدام أي حرف إنجليزي أو لغة أخرى على الإطلاق.
لكل بطاقة، يجب تعبئة الخصائص التالية بشكل كامل وبالعربية فقط:
- 'front': وجه البطاقة، ويحتوي على السؤال أو المصطلح أو المفهوم باللغة العربية الفصحى وبوضوح تام.
- 'back': خلف البطاقة، ويحتوي على الشرح الموجز أو الإجابة الشافية والدقيقة باللغة العربية الفصحى بشكل يسهل حفظه.
- 'arabicFront': كرر فيه وجه البطاقة بالعربية بالضبط (نفس قيمة front).
- 'arabicBack': كرر فيه خلف البطاقة بالعربية بالضبط (نفس قيمة back).
- 'notes': تلميح بسيط أو ملاحظة ذكية أو طريقة لحفظ المفهوم باللغة العربية لمساعدة الطالب في التذكر.

تأكد من عدم توليد أي حرف إنجليزي أو لغة أخرى في المخرجات، ويجب أن تكون النتيجة عبارة عن مصفوفة JSON صالحة تماماً.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "الوجه الأمامي للبطاقة (مصطلح أو سؤال بالعربية)"
              },
              back: {
                type: Type.STRING,
                description: "الوجه الخلفي للبطاقة (شرح أو جواب بالعربية)"
              },
              arabicFront: {
                type: Type.STRING,
                description: "الوجه الأمامي للبطاقة بالعربية (مطابق لـ front)"
              },
              arabicBack: {
                type: Type.STRING,
                description: "الوجه الخلفي للبطاقة بالعربية (مطابق لـ back)"
              },
              notes: {
                type: Type.STRING,
                description: "تلميح أو ملاحظة بالعربية للمساعدة في الحفظ"
              }
            },
            required: ["front", "back", "arabicFront", "arabicBack"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("لقد أعاد نموذج الذكاء الاصطناعي استجابة فارغة.");
    }

    // Parse the structured text directly
    const cards = JSON.parse(responseText.trim());
    return res.json({ cards });

  } catch (error: any) {
    console.error("AI Flashcard Generation Error Details:", error);
    return res.status(500).json({
      error: "فشل توليد البطاقات بالذكاء الاصطناعي. يرجى التأكد من إعداد مفتاح GEMINI_API_KEY بشكل صحيح.",
      details: error?.message || String(error)
    });
  }
});

// Configure Vite or Static Asset routing
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode mounting Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving pre-compiled builds
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FlashRep AI Server] Server listening at http://localhost:${PORT}`);
  });
}

initServer().catch((error) => {
  console.error("Express startup crashed:", error);
});
