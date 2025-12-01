import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import type { IdentityArtifact } from '@/types/database';
import { ARTIST_SYSTEM_PROMPT, getIndustryColors } from '@/config/agentPrompts';

// ============================================
// SCHEMA DEFINITION
// ============================================

export const designSchema = z.object({
  businessName: z.string().describe('The name of the business'),
  businessDescription: z.string().describe('A description of what the business does'),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateBusinessName(description: string): string {
  // Extract key words and generate punchy name
  const words = description.toLowerCase().split(' ');
  const businessType = words.find(
    (w) =>
      ['coffee', 'tech', 'food', 'fitness', 'dog', 'walk', 'design', 'app'].includes(w) || w.length > 4
  );

  const prefixes = ['Nova', 'Apex', 'Swift', 'Pure', 'Elite', 'Prime', 'Urban', 'Nordic'];
  const suffixes = ['Hub', 'Labs', 'Co', 'Works', 'Pro', 'Zone', 'Space', 'Studio'];

  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  if (businessType) {
    const capitalized = businessType.charAt(0).toUpperCase() + businessType.slice(1);
    return Math.random() > 0.5 ? `${randomPrefix}${capitalized}` : `${capitalized}${randomSuffix}`;
  }

  return `${randomPrefix}${randomSuffix}`;
}

function generateTagline(businessName: string, description: string): string {
  const templates = [
    `Elevating ${description.split(' ').slice(0, 3).join(' ')}`,
    `Your trusted partner in ${description.split(' ').slice(0, 3).join(' ')}`,
    `Where ${description.split(' ').slice(0, 3).join(' ')} meets excellence`,
    `Redefining ${description.split(' ').slice(0, 3).join(' ')}`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateLogoPrompt(businessName: string, description: string): string {
  // Generate optimized AI logo prompt following Artist system prompt
  const businessType = description.toLowerCase();

  let style = 'minimalist';
  let subject = businessName.toLowerCase();

  if (businessType.includes('tech') || businessType.includes('software')) {
    style = 'geometric, modern, tech';
  } else if (businessType.includes('food') || businessType.includes('coffee')) {
    style = 'warm, friendly, organic';
  } else if (businessType.includes('luxury')) {
    style = 'elegant, sophisticated, premium';
  } else if (businessType.includes('eco') || businessType.includes('green')) {
    style = 'natural, organic, earthy';
  }

  return `${style} logo for ${subject}, vector style, clean lines, professional, white background, simple, memorable`;
}

async function generateLogoWithAI(
  businessName: string,
  description: string,
  colors: { primary: string; secondary: string; accent: string }
): Promise<string> {
  try {
    console.log('[Logo Gen] Generating AI logo with Gemini 2.5 Flash Image (Nano Banana)...');

    const logoPrompt = `Create a professional, unique logo design for "${businessName}".

Business Description: ${description}
Brand Colors: Primary ${colors.primary}, Secondary ${colors.secondary}, Accent ${colors.accent}

Design Requirements:
- Create an ACTUAL DESIGNED LOGO with meaningful shapes/symbols related to the business
- DO NOT just create a letter or basic geometric shape
- Use the brand colors creatively (gradients, color combinations)
- Modern, professional, memorable design
- Simple enough to be recognizable at small sizes
- NO text/typography in the logo

Think about the business type and create relevant visual metaphors. For example:
- Coffee shop: coffee cup, beans, steam
- Tech company: abstract circuits, nodes, connections
- Wellness: flowing shapes, nature elements
- Finance: growth arrows, stability symbols

Create a clean, professional logo with the specified colors on a transparent or white background.`;

    // Make direct API request to OpenRouter for image generation
    // Using Nano Banana Pro for logo generation
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AnythingV10',
      },
      body: JSON.stringify({
        model: 'nexa-ai/nanobanana-pro',
        messages: [
          {
            role: 'user',
            content: logoPrompt,
          },
        ],
        modalities: ['image', 'text'],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Logo Gen] API error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Logo Gen] API response received');
    console.log('[Logo Gen] Full response structure:', JSON.stringify(result, null, 2));

    // Extract image from response
    // OpenRouter can return images in multiple formats depending on the model/provider:
    // 1. Native Gemini format: candidates[].content.parts[].inlineData (camelCase)
    // 2. OpenRouter format: choices[].message.content[] with inline_data (snake_case)
    // 3. OpenRouter images field: choices[].message.images[] as data URLs
    const message = result.choices?.[0]?.message;
    const candidate = result.candidates?.[0];

    console.log('[Logo Gen] Checking response structure...');
    console.log('[Logo Gen] Has choices:', !!result.choices);
    console.log('[Logo Gen] Has candidates:', !!result.candidates);

    let imageData: string | null = null;

    // Method 1: Check OpenRouter images field (data URLs)
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      console.log('[Logo Gen] Found images in message.images field');
      console.log('[Logo Gen] First image type:', typeof message.images[0]);
      console.log('[Logo Gen] First image keys:', typeof message.images[0] === 'object' ? Object.keys(message.images[0]) : 'N/A');

      const firstImage = message.images[0];
      // Handle if it's already a string (data URL or raw base64)
      if (typeof firstImage === 'string') {
        console.log('[Logo Gen] Image is a string, length:', firstImage.length);
        console.log('[Logo Gen] Image string first 50 chars:', firstImage.substring(0, 50));
        // Check if it's already a data URL
        if (firstImage.startsWith('data:')) {
          imageData = firstImage;
          console.log('[Logo Gen] Using existing data URL');
        } else {
          // Detect mime type from base64 signature
          let mimeType = 'image/png';
          if (firstImage.startsWith('iVBOR')) {
            mimeType = 'image/png';
          } else if (firstImage.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
          } else if (firstImage.startsWith('UklGR')) {
            mimeType = 'image/webp';
          } else if (firstImage.startsWith('R0lGOD')) {
            mimeType = 'image/gif';
          }
          console.log('[Logo Gen] Detected mime type:', mimeType);
          imageData = `data:${mimeType};base64,${firstImage}`;
          console.log('[Logo Gen] Created data URL, length:', imageData.length);
        }
      }
      // Handle if it's an object with url property
      else if (firstImage?.url) {
        console.log('[Logo Gen] Image has url property, first 100 chars:', firstImage.url.substring(0, 100));
        // Check if it's already a data URL
        if (firstImage.url.startsWith('data:')) {
          imageData = firstImage.url;
        } else {
          // Assume it's raw base64, add the data URL prefix
          imageData = `data:image/png;base64,${firstImage.url}`;
        }
      }
      // Handle if it's an object with data property (base64)
      else if (firstImage?.data) {
        const mimeType = firstImage.mime_type || firstImage.mimeType || 'image/png';
        console.log('[Logo Gen] Image has data property, mimeType:', mimeType);
        imageData = `data:${mimeType};base64,${firstImage.data}`;
      }
      // Handle if it's an object with b64_json property (OpenAI-style)
      else if (firstImage?.b64_json) {
        console.log('[Logo Gen] Image has b64_json property');
        imageData = `data:image/png;base64,${firstImage.b64_json}`;
      }
      // Handle OpenRouter/Gemini format: { type: "image_url", image_url: { url: "data:..." } }
      else if (firstImage?.type === 'image_url' && firstImage?.image_url?.url) {
        console.log('[Logo Gen] Found image_url object format');
        imageData = firstImage.image_url.url;
      }
      else {
        console.log('[Logo Gen] Unknown image format:', JSON.stringify(firstImage, null, 2).substring(0, 500));
      }

      console.log('[Logo Gen] Image data URL length:', imageData?.length);
      console.log('[Logo Gen] Image data URL starts with:', imageData?.substring(0, 50));
    }

    // Method 2: Check message.content array for inline_data (snake_case) or inlineData (camelCase)
    if (!imageData && message?.content) {
      console.log('[Logo Gen] Message content type:', typeof message.content);

      if (Array.isArray(message.content)) {
        console.log('[Logo Gen] Content is array with', message.content.length, 'parts');
        for (const part of message.content) {
          // Check snake_case format (inline_data)
          if (part.inline_data) {
            const { mime_type, data } = part.inline_data;
            imageData = `data:${mime_type || 'image/png'};base64,${data}`;
            console.log('[Logo Gen] Found inline_data (snake_case), mime:', mime_type);
            break;
          }
          // Check camelCase format (inlineData)
          if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            imageData = `data:${mimeType || 'image/png'};base64,${data}`;
            console.log('[Logo Gen] Found inlineData (camelCase), mime:', mimeType);
            break;
          }
          // Check for type: image with data URL
          if (part.type === 'image' && part.image_url?.url) {
            imageData = part.image_url.url;
            console.log('[Logo Gen] Found image_url format');
            break;
          }
        }
      }
    }

    // Method 3: Check native Gemini candidates format
    if (!imageData && candidate?.content?.parts) {
      console.log('[Logo Gen] Checking candidates format...');
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const { mimeType, data } = part.inlineData;
          imageData = `data:${mimeType || 'image/png'};base64,${data}`;
          console.log('[Logo Gen] Found inlineData in candidates, mime:', mimeType);
          break;
        }
      }
    }

    if (!imageData) {
      console.error('[Logo Gen] No image data found. Full response:', JSON.stringify(result, null, 2).slice(0, 2000));
      throw new Error('No image data in response');
    }

    // Final validation: ensure we have a proper data URL
    if (!imageData.startsWith('data:')) {
      console.log('[Logo Gen] Image data missing data: prefix, adding it');
      imageData = `data:image/png;base64,${imageData}`;
    }

    console.log('[Logo Gen] ✅ Logo generated successfully');
    console.log('[Logo Gen] Final image data URL length:', imageData.length);
    console.log('[Logo Gen] Final image data URL prefix:', imageData.substring(0, 50));

    // Validate the base64 data is reasonable
    if (imageData.length < 1000) {
      console.error('[Logo Gen] Image data too small, likely invalid');
      throw new Error('Generated image data is too small');
    }

    return imageData;
  } catch (error) {
    console.error('[Logo Gen] Error generating logo:', error);
    return generateFallbackLogo(businessName, colors.primary);
  }
}

function generateFallbackLogo(businessName: string, primaryColor: string): string {
  // Simple fallback SVG with first letter
  const initial = businessName.charAt(0).toUpperCase();
  const svg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${primaryColor}"/>
    <text x="200" y="250" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function selectFont(businessType: string): string {
  const lowerDesc = businessType.toLowerCase();

  if (lowerDesc.includes('tech') || lowerDesc.includes('modern') || lowerDesc.includes('software')) {
    return 'Inter, sans-serif';
  }
  if (lowerDesc.includes('luxury') || lowerDesc.includes('premium') || lowerDesc.includes('fashion')) {
    return 'Playfair Display, serif';
  }
  if (lowerDesc.includes('creative') || lowerDesc.includes('art') || lowerDesc.includes('design')) {
    return 'Space Grotesk, sans-serif';
  }
  if (lowerDesc.includes('food') || lowerDesc.includes('restaurant') || lowerDesc.includes('coffee')) {
    return 'Poppins, sans-serif';
  }

  return 'Inter, sans-serif'; // Default
}

// ============================================
// TOOL IMPLEMENTATION
// ============================================

export async function generateBrandIdentity(params: z.infer<typeof designSchema> & { projectId: string }) {
  const { businessName, businessDescription, projectId } = params;

  try {
    console.log('[Design Tool] 🎨 Starting brand identity generation...');

    // Generate intelligent brand identity using industry psychology
    const generatedName = businessName || generateBusinessName(businessDescription);
    console.log(`[Design Tool] Generated business name: ${generatedName}`);

    const colors = getIndustryColors(businessDescription);
    console.log(`[Design Tool] Selected brand colors: ${colors.primary}`);

    // Generate AI logo with nanobanana-pro
    console.log('[Design Tool] Generating logo with AI...');
    const logoUrl = await generateLogoWithAI(generatedName, businessDescription, colors);

    const identityData: IdentityArtifact = {
      name: generatedName,
      logoUrl,
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
      },
      font: selectFont(businessDescription),
      tagline: generateTagline(generatedName, businessDescription),
    };

    // Save to Supabase with UPSERT for updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error} = await (supabase
      .from('artifacts') as any)
      .upsert(
        {
          project_id: projectId,
          type: 'identity',
          data: identityData,
          version: 1,
        },
        {
          onConflict: 'project_id,type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save identity artifact:', error);
      throw new Error('Failed to save brand identity');
    }

    return {
      success: true,
      artifact,
      summary: `🎨 Created "${generatedName}" with ${colors.primary} brand colors`,
      identity: identityData, // Return for use by other tools
    };
  } catch (error) {
    console.error('Brand identity generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
