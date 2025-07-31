import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const dreamAnalysisSchema = z.object({
  themes: z
    .array(z.string())
    .describe(
      "Array of dream themes detected (e.g., flying, water, animals, family, etc.)",
    ),
  emotions: z
    .array(z.string())
    .describe(
      "Array of emotions detected (e.g., fear, happy, sad, anxious, etc.)",
    ),
  intensity: z
    .number()
    .min(1)
    .max(10)
    .describe("Overall emotional intensity of the dream from 1-10"),
  symbolism: z
    .array(z.string())
    .describe("Key symbolic elements found in the dream"),
});

export async function analyzeDreamWithAI(description: string) {
  try {
    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: dreamAnalysisSchema as any,
      prompt: `Analyze this dream description and return a JSON object with the exact structure requested. Do not wrap the response in any additional objects.

Dream description: "${description}"

Return a JSON object with these exact fields:
- themes: Array of strings representing dream themes (e.g., ["flying", "water", "family"])
- emotions: Array of strings representing emotions (e.g., ["happy", "anxious", "peaceful"])
- intensity: A number from 1-10 representing emotional intensity
- symbolism: Array of strings describing symbolic elements (e.g., ["water represents emotions", "flying represents freedom"])

Example response format:
{
  "themes": ["flying", "water"],
  "emotions": ["happy", "anxious"],
  "intensity": 7,
  "symbolism": ["water represents emotional state", "flying represents desire for freedom"]
}

Analyze the dream and respond with the exact JSON structure above.`,
    });

    const analysis: z.infer<typeof dreamAnalysisSchema> = result.object as any;

    // Validate the response structure
    if (!analysis || typeof analysis !== "object") {
      throw new Error("Invalid analysis structure");
    }

    // Ensure arrays are properly formatted
    const validatedAnalysis = {
      themes: Array.isArray(analysis.themes) ? analysis.themes : [],
      emotions: Array.isArray(analysis.emotions) ? analysis.emotions : [],
      intensity:
        typeof analysis.intensity === "number" ? analysis.intensity : 5,
      symbolism: Array.isArray(analysis.symbolism) ? analysis.symbolism : [],
    };

    // Generate visual representation based on AI analysis
    const visual = generateVisual(
      validatedAnalysis.themes,
      validatedAnalysis.emotions,
      validatedAnalysis.intensity,
      description,
    );

    return {
      themes: validatedAnalysis.themes,
      emotions: validatedAnalysis.emotions,
      intensity: validatedAnalysis.intensity,
      symbolism: validatedAnalysis.symbolism,
      visual,
    };
  } catch (error) {
    console.error(
      "AI analysis failed, falling back to keyword analysis:",
      error,
    );

    // Fallback to keyword-based analysis if AI fails
    return analyzeDreamKeywords(description);
  }
}

function generateVisual(
  themes: string[],
  emotions: string[],
  intensity: number,
  text: string,
) {
  // Enhanced color palette based on emotions and intensity
  const emotionColors = {
    fear: ["#1a202c", "#2d3748", "#4a5568"],
    happy: ["#f6e05e", "#ed8936", "#dd6b20"],
    sad: ["#2b6cb0", "#3182ce", "#4299e1"],
    angry: ["#9b2c2c", "#c53030", "#e53e3e"],
    confused: ["#553c9a", "#6b46c1", "#805ad5"],
    peaceful: ["#2c7a7b", "#319795", "#38b2ac"],
    anxious: ["#c05621", "#dd6b20", "#ed8936"],
    excited: ["#d69e2e", "#f6e05e", "#faf089"],
    neutral: ["#4a5568", "#718096", "#a0aec0"],
    mysterious: ["#553c9a", "#6b46c1", "#805ad5"],
  };

  // Get dominant emotion with fallback
  const dominantEmotion = emotions.length > 0 ? emotions[0] : "neutral";
  const palette =
    emotionColors[dominantEmotion as keyof typeof emotionColors] ||
    emotionColors.neutral;

  // Adjust colors based on intensity
  const intensityMultiplier = Math.max(0.1, Math.min(1, intensity / 10));
  const backgroundColor = palette[0];

  // Generate shapes based on themes, emotions, and intensity
  const shapes = [];
  const shapeCount = Math.min(
    12,
    Math.max(3, themes.length + emotions.length + Math.floor(intensity / 2)),
  );

  for (let i = 0; i < shapeCount; i++) {
    const emotion =
      emotions.length > 0 ? emotions[i % emotions.length] : "neutral";
    const theme = themes.length > 0 ? themes[i % themes.length] : "mysterious";

    // Enhanced shape types based on themes
    const shapeTypes: Record<string, string> = {
      flying: "circle",
      water: "circle",
      animals: "circle",
      nature: "circle",
      family: "square",
      school: "square",
      work: "square",
      house: "square",
      car: "square",
      food: "circle",
      money: "square",
      death: "triangle",
      chase: "triangle",
      fear: "triangle",
      mysterious: "triangle",
    };

    const baseSize = 20 + intensity * 4;

    shapes.push({
      type: shapeTypes[theme] || "circle",
      size: baseSize + Math.random() * 40,
      x: Math.random() * 80,
      y: Math.random() * 80,
      color: (emotionColors[emotion as keyof typeof emotionColors] ||
        emotionColors.neutral)[Math.floor(Math.random() * 3)],
      opacity: 0.2 + intensityMultiplier * 0.6,
      rotation: Math.random() * 360,
    });
  }

  // Generate particles based on intensity
  const particles = [];
  const particleCount = Math.floor(10 + intensity * 2 + Math.random() * 10);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 2 + Math.random() * 4,
    });
  }

  return { backgroundColor, shapes, particles, intensity };
}

// Fallback keyword-based analysis
function analyzeDreamKeywords(description: string) {
  const text = description.toLowerCase();

  const themeKeywords: Record<string, string[]> = {
    flying: ["fly", "flying", "soar", "float", "hover", "glide"],
    water: [
      "water",
      "ocean",
      "sea",
      "river",
      "lake",
      "swimming",
      "drowning",
      "rain",
    ],
    animals: [
      "dog",
      "cat",
      "bird",
      "snake",
      "lion",
      "tiger",
      "elephant",
      "horse",
      "fish",
    ],
    family: [
      "mother",
      "father",
      "mom",
      "dad",
      "sister",
      "brother",
      "family",
      "parents",
    ],
    school: [
      "school",
      "classroom",
      "teacher",
      "exam",
      "test",
      "homework",
      "student",
    ],
    work: ["work", "office", "boss", "job", "meeting", "colleague", "career"],
    death: ["death", "die", "dead", "funeral", "grave", "ghost"],
    chase: ["chase", "run", "escape", "pursue", "follow", "hunt"],
    house: ["house", "home", "room", "door", "window", "building"],
    car: ["car", "drive", "driving", "vehicle", "road", "crash"],
  };

  const emotionKeywords: Record<string, string[]> = {
    fear: ["scared", "afraid", "terrified", "frightened", "panic", "nightmare"],
    happy: ["happy", "joy", "excited", "wonderful", "amazing", "beautiful"],
    sad: ["sad", "cry", "crying", "depressed", "lonely", "empty"],
    angry: ["angry", "mad", "furious", "rage", "hate", "annoyed"],
    confused: ["confused", "lost", "weird", "strange", "bizarre", "unclear"],
    peaceful: ["calm", "peaceful", "serene", "relaxed", "tranquil"],
    anxious: ["worried", "anxious", "nervous", "stress", "overwhelming"],
  };

  const themes: string[] = [];
  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      themes.push(theme);
    }
  });

  const emotions: string[] = [];
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      emotions.push(emotion);
    }
  });

  // Ensure we always have at least one theme and emotion
  if (themes.length === 0) themes.push("mysterious");
  if (emotions.length === 0) emotions.push("neutral");

  // Generate basic symbolism based on detected themes
  const symbolism = themes.map((theme) => {
    const symbolMap: Record<string, string> = {
      flying: "desire for freedom or escape",
      water: "emotions and subconscious mind",
      animals: "instincts and natural behavior",
      family: "relationships and personal connections",
      school: "learning and personal growth",
      work: "responsibilities and achievements",
      death: "transformation and change",
      chase: "avoidance or pursuit of goals",
      house: "self and personal space",
      car: "life direction and control",
      mysterious: "unknown aspects of self",
    };
    return symbolMap[theme] || "personal significance";
  });

  const visual = generateVisual(themes, emotions, 5, text);

  return {
    themes,
    emotions,
    intensity: 5,
    symbolism,
    visual,
  };
}
