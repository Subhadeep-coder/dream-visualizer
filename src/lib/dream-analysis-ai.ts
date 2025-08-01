import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

const dreamAnalysisSchema = z.object({
  themes: z
    .array(z.string())
    .min(2)
    .max(8)
    .describe("Array of unique dream themes extracted from content"),
  emotions: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Array of emotions detected in the dream"),
  intensity: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("Overall emotional intensity from 1-10"),
  symbolism: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Symbolic interpretations of dream elements"),
  visualDesign: z.object({
    colorPalette: z.object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      particles: z
        .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
        .min(3)
        .max(5),
    }),
    shapes: z
      .array(
        z.object({
          type: z.enum(["circle", "square", "triangle", "organic"]),
          size: z.number().int().min(15).max(85),
          position: z.object({
            x: z.number().int().min(5).max(95),
            y: z.number().int().min(5).max(95),
          }),
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          opacity: z.number().min(0.2).max(0.9),
          rotation: z.number().int().min(0).max(360),
          animation: z.enum(["float", "pulse", "rotate", "static"]),
        }),
      )
      .min(4)
      .max(12),
    particles: z
      .array(
        z.object({
          x: z.number().int().min(0).max(100),
          y: z.number().int().min(0).max(100),
          size: z.number().int().min(2).max(7),
          color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          animation: z.enum(["float", "twinkle", "drift", "static"]),
        }),
      )
      .min(6)
      .max(18),
    atmosphere: z.object({
      mood: z.string().min(3).max(20),
      lighting: z.enum(["bright", "dim", "ethereal", "dramatic"]),
      texture: z.enum(["smooth", "rough", "flowing", "crystalline"]),
    }),
  }),
});

type DreamAnalysis = z.output<typeof dreamAnalysisSchema>;

export async function analyzeDreamWithAI(description: string) {
  try {
    const result = await generateObject<DreamAnalysis>({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      schema: dreamAnalysisSchema,
      prompt: createAIDrivenPrompt(description),
      maxTokens: 3000,
      temperature: 0.85, // High creativity but still controlled
    });

    console.log("AI Analysis Result:", JSON.stringify(result.object, null, 2));

    const analysis = dreamAnalysisSchema.parse(result.object);
    const visual = generateAIVisual(analysis.visualDesign, analysis.intensity);

    return {
      themes: analysis.themes,
      emotions: analysis.emotions,
      intensity: analysis.intensity,
      symbolism: analysis.symbolism,
      visual,
      aiDesign: analysis.visualDesign,
    };
  } catch (error) {
    console.error("AI analysis failed:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
    }

    return generateMinimalFallback(description);
  }
}

function createAIDrivenPrompt(description: string): string {
  return `You are an expert dream analyst and creative visual artist. Analyze this dream and create a completely unique visual representation. Every dream should result in different colors, layouts, and designs.

DREAM: "${description}"

Your task is to:
1. DEEPLY ANALYZE the dream's unique content, emotions, and themes
2. CREATE a visual design that is COMPLETELY SPECIFIC to this dream
3. AVOID any generic or template responses
4. MAKE EVERY ELEMENT meaningful and tied to the dream content

IMPORTANT: Each dream is unique - create visuals that would be completely different for different dreams.

ANALYSIS REQUIREMENTS:
- Extract 2-8 themes that are SPECIFIC to this dream's content
- Identify 2-6 emotions that reflect the dream's emotional landscape
- Rate intensity 1-10 based on the emotional weight of the dream
- Provide 2-6 symbolic interpretations based on the dream's actual elements

VISUAL DESIGN REQUIREMENTS:
- Choose colors that directly reflect THIS dream's mood and content
- Create 4-12 shapes with sizes, positions, and styles that represent dream elements
- Add 6-18 particles with density and movement matching the dream's energy
- Set atmosphere (mood, lighting, texture) that captures the dream's essence

CREATIVE GUIDELINES:
- If the dream is about achievement → Use celebratory colors, upward shapes, dynamic particles
- If it's about longing/missing → Use warm/cool contrasts, flowing shapes, drifting particles
- If it's about learning → Use structured colors, geometric shapes, organized particles
- If it's about relationships → Use harmonious colors, interconnected shapes, social particles
- For mixed emotions → Use color contrasts, varied shapes, complex particle movements

CRITICAL: Base everything on the ACTUAL dream content, not generic templates.

Return ONLY this JSON structure:
{
  "themes": ["specific theme 1", "specific theme 2", "etc"],
  "emotions": ["specific emotion 1", "specific emotion 2", "etc"],
  "intensity": number_1_to_10,
  "symbolism": ["meaningful interpretation 1", "meaningful interpretation 2", "etc"],
  "visualDesign": {
    "colorPalette": {
      "primary": "#XXXXXX",
      "secondary": "#XXXXXX",
      "accent": "#XXXXXX",
      "background": "#XXXXXX",
      "particles": ["#XXXXXX", "#XXXXXX", "#XXXXXX"]
    },
    "shapes": [
      {
        "type": "circle|square|triangle|organic",
        "size": 15-85,
        "position": {"x": 5-95, "y": 5-95},
        "color": "#XXXXXX",
        "opacity": 0.2-0.9,
        "rotation": 0-360,
        "animation": "float|pulse|rotate|static"
      }
    ],
    "particles": [
      {
        "x": 0-100,
        "y": 0-100,
        "size": 2-7,
        "color": "#XXXXXX",
        "animation": "float|twinkle|drift|static"
      }
    ],
    "atmosphere": {
      "mood": "descriptive_mood_word",
      "lighting": "bright|dim|ethereal|dramatic",
      "texture": "smooth|rough|flowing|crystalline"
    }
  }
}

REMEMBER: Make this visualization completely unique to THIS specific dream. No two dreams should ever produce the same visual result.`;
}

function generateAIVisual(visualDesign: any, intensity: number) {
  return {
    backgroundColor: visualDesign.colorPalette.background,
    shapes: visualDesign.shapes.map((shape: any) => ({
      type: shape.type,
      size: shape.size,
      x: shape.position.x,
      y: shape.position.y,
      color: shape.color,
      opacity: shape.opacity,
      rotation: shape.rotation,
      animation: shape.animation,
    })),
    particles: visualDesign.particles.map((particle: any) => ({
      x: particle.x,
      y: particle.y,
      size: particle.size,
      color: particle.color,
      animation: particle.animation,
    })),
    atmosphere: visualDesign.atmosphere,
    colorPalette: visualDesign.colorPalette,
    intensity,
  };
}

function generateMinimalFallback(description: string) {
  // Simple fallback that still tries to be somewhat dynamic
  const randomSeed = description.length + description.charCodeAt(0);

  // Generate somewhat random but consistent colors based on description
  const colorVariations = [
    {
      primary: "#3B82F6",
      secondary: "#EF4444",
      accent: "#10B981",
      background: "#F3F4F6",
      particles: ["#3B82F6", "#EF4444", "#10B981"],
    },
    {
      primary: "#8B5CF6",
      secondary: "#F59E0B",
      accent: "#EF4444",
      background: "#FEF3C7",
      particles: ["#8B5CF6", "#F59E0B", "#EF4444"],
    },
    {
      primary: "#10B981",
      secondary: "#3B82F6",
      accent: "#F59E0B",
      background: "#ECFDF5",
      particles: ["#10B981", "#3B82F6", "#F59E0B"],
    },
    {
      primary: "#F59E0B",
      secondary: "#EF4444",
      accent: "#8B5CF6",
      background: "#FFFBEB",
      particles: ["#F59E0B", "#EF4444", "#8B5CF6"],
    },
  ];

  const colorScheme = colorVariations[randomSeed % colorVariations.length];

  // Generate shapes with some variation
  const shapeCount = 4 + (randomSeed % 4);
  const shapes = [];
  const shapeTypes = ["circle", "square", "triangle", "organic"];

  for (let i = 0; i < shapeCount; i++) {
    shapes.push({
      type: shapeTypes[(randomSeed + i) % 4],
      size: 25 + ((randomSeed + i * 13) % 35),
      position: {
        x: 10 + ((randomSeed + i * 17) % 70),
        y: 10 + ((randomSeed + i * 23) % 70),
      },
      color: [colorScheme.primary, colorScheme.secondary, colorScheme.accent][
        (randomSeed + i) % 3
      ],
      opacity: 0.4 + ((randomSeed + i * 7) % 30) / 100,
      rotation: (randomSeed + i * 31) % 360,
      animation: ["float", "pulse", "rotate", "static"][(randomSeed + i) % 4],
    });
  }

  // Generate particles
  const particleCount = 6 + (randomSeed % 6);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: (randomSeed + i * 19) % 100,
      y: (randomSeed + i * 29) % 100,
      size: 2 + ((randomSeed + i * 11) % 4),
      color: colorScheme.particles[(randomSeed + i) % 3],
      animation: ["float", "twinkle", "drift"][(randomSeed + i) % 3],
    });
  }

  const visualDesign = {
    colorPalette: colorScheme,
    shapes,
    particles,
    atmosphere: {
      mood: ["dreamy", "contemplative", "vibrant", "mysterious"][
        randomSeed % 4
      ],
      lighting: ["ethereal", "bright", "dim", "dramatic"][randomSeed % 4],
      texture: ["flowing", "smooth", "crystalline", "rough"][randomSeed % 4],
    },
  };

  return {
    themes: ["personal experience", "subconscious exploration"],
    emotions: ["mixed feelings", "introspection"],
    intensity: 5 + (randomSeed % 3),
    symbolism: ["personal growth", "inner reflection"],
    visual: generateAIVisual(visualDesign, 5),
  };
}
