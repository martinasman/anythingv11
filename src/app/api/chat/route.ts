import { streamText, stepCountIs, tool } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@/utils/supabase/server';
import type { ArtifactType } from '@/types/database';
import { performMarketResearch, researchSchema } from '../tools/tool-research';
import { generateBrandIdentity, designSchema } from '../tools/tool-design';
import { generateWebsiteFiles, codeGenSchema } from '../tools/tool-code';
import { generateBusinessPlan, businessPlanSchema } from '../tools/tool-businessplan';
import { generateLeads, leadsSchema } from '../tools/tool-leads';
import { generateOutreachScripts, outreachSchema } from '../tools/tool-outreach';
import { generateFirstWeekPlan, firstWeekPlanSchema } from '../tools/tool-first-week-plan';
// Edit tools for modifying existing artifacts
import { editWebsiteFiles, editWebsiteSchema } from '../tools/tool-edit-website';
import { editBrandIdentity, editIdentitySchema } from '../tools/tool-edit-identity';
import { editPricing, editPricingSchema } from '../tools/tool-edit-pricing';
// AI system prompt
import { ORCHESTRATOR_SYSTEM_PROMPT } from '@/config/agentPrompts';

// ============================================
// TOOL DISPLAY NAMES (simplified)
// ============================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  perform_market_research: 'Researching your market',
  generate_brand_identity: 'Creating your brand',
  generate_business_plan: 'Setting up your offer',
  generate_website_files: 'Building your website',
  generate_first_week_plan: 'Planning your first week',
  generate_leads: 'Finding prospects',
  generate_outreach_scripts: 'Writing outreach scripts',
  edit_website: 'Updating website',
  edit_identity: 'Updating brand',
  edit_pricing: 'Updating pricing',
};

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(req: Request) {
  try {
    const { messages, projectId, modelId, assistantMessageId } = await req.json();

    if (!projectId) {
      return new Response('Project ID is required', { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use selected model or default to Claude 3.5 Sonnet
    // Model selector already filters for tool-compatible models
    let selectedModel = modelId || 'anthropic/claude-3.5-sonnet';
    if (selectedModel.endsWith(':free')) {
      selectedModel = selectedModel.replace(':free', '');
      console.log('[Chat API] ⚠️ Stripped :free suffix for tool support');
    }

    console.log('[Chat API] Model:', selectedModel);
    console.log('[Chat API] Messages count:', messages.length);

    // Save user message FIRST (before streaming)
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      const { error: userMsgError } = await (supabase.from('messages') as any).insert({
        id: userMessage.id, // Pass client-generated ID for deduplication
        project_id: projectId,
        role: 'user',
        content: userMessage.content,
      });
      if (userMsgError) console.error('[DB] User message save failed:', userMsgError);
    }

    // Always use orchestrator (no phase system)
    const SYSTEM_PROMPT = ORCHESTRATOR_SYSTEM_PROMPT;

    console.log('[Chat API] System prompt loaded');


    // Tool definitions
    const tools = {
      perform_market_research: tool({
        description:
          'Perform comprehensive market research to identify competitors, pricing strategies, and market opportunities for a business idea',
        inputSchema: researchSchema,
        execute: async (params) => {
          return await performMarketResearch({ ...params, projectId });
        },
      }),
      generate_brand_identity: tool({
        description:
          'Generate a complete brand identity including logo, color palette, typography, and tagline',
        inputSchema: designSchema,
        execute: async (params) => {
          return await generateBrandIdentity({ ...params, projectId });
        },
      }),
      generate_business_plan: tool({
        description:
          'Generate a complete business plan with pricing tiers, service packages, revenue model, and value proposition',
        inputSchema: businessPlanSchema,
        execute: async (params) => {
          return await generateBusinessPlan({ ...params, projectId });
        },
      }),
      generate_website_files: tool({
        description:
          'Generate a complete, responsive website with HTML, CSS, and JavaScript files based on the business description and brand identity',
        inputSchema: codeGenSchema,
        execute: async (params) => {
          return await generateWebsiteFiles({ ...params, projectId, modelId: selectedModel });
        },
      }),
      generate_leads: tool({
        description:
          'Generate a list of qualified potential customers/leads by searching the web for companies that match the ideal customer profile',
        inputSchema: leadsSchema,
        execute: async (params) => {
          console.log('[Route] generate_leads called with:', JSON.stringify(params));
          try {
            return await generateLeads({ ...params, projectId });
          } catch (err) {
            console.error('[Route] generate_leads error:', err);
            return { success: false, error: String(err) };
          }
        },
      }),
      generate_outreach_scripts: tool({
        description:
          'Generate personalized cold call scripts and email sequences for each lead, tailored to their industry and pain points',
        inputSchema: outreachSchema,
        execute: async (params) => {
          return await generateOutreachScripts({ ...params, projectId });
        },
      }),
      generate_first_week_plan: tool({
        description:
          'Generate a day-by-day action plan to make money in the first week. Creates specific tasks, outreach scripts, and success metrics for landing the first client.',
        inputSchema: firstWeekPlanSchema,
        execute: async (params) => {
          return await generateFirstWeekPlan({ ...params, projectId });
        },
      }),
      // Edit tools for modifying existing artifacts
      edit_website: tool({
        description:
          'Edit an existing website - use this to make changes like updating colors, text, layout, or sections. DO NOT use generate_website_files for edits.',
        inputSchema: editWebsiteSchema,
        execute: async (params) => {
          return await editWebsiteFiles({
            ...params,
            projectId,
            onProgress: async (update) => {
              if (update.type === 'stage') {
                // Emit progress stage marker
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              } else if (update.type === 'change') {
                // Emit code change marker
                const marker = `[CODE_CHANGE:${update.file}:${update.description}${update.before && update.after ? `|${update.before}|${update.after}` : ''}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      edit_identity: tool({
        description:
          'Edit the existing brand identity - use this to change the business name, colors, tagline, or regenerate the logo. Do NOT use generate_brand_identity for edits.',
        inputSchema: editIdentitySchema,
        execute: async (params) => {
          return await editBrandIdentity({
            ...params,
            projectId,
            onProgress: async (update) => {
              if (update.type === 'stage') {
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
      edit_pricing: tool({
        description:
          'Edit the existing pricing and business plan - use this to add/remove tiers, change prices, or update service packages. Do NOT use generate_business_plan for edits.',
        inputSchema: editPricingSchema,
        execute: async (params) => {
          return await editPricing({
            ...params,
            projectId,
            onProgress: async (update) => {
              if (update.type === 'stage') {
                const marker = `[PROGRESS:${update.stage}:${update.message}]\n`;
                await writeProgress(marker);
              }
            }
          });
        },
      }),
    };

    // Create a custom readable stream for progress updates
    const encoder = new TextEncoder();
    const progressStream = new TransformStream<Uint8Array, Uint8Array>();
    const progressWriter = progressStream.writable.getWriter();

    // Helper to write progress messages
    const writeProgress = async (message: string) => {
      await progressWriter.write(encoder.encode(message));
    };

    // Track active tools for progress display
    const activeTools = new Set<string>();
    const completedTools = new Set<string>();
    const toolStartTimes: Record<string, number> = {};

    // Stream AI response with tools
    const result = streamText({
      model: openrouter(selectedModel),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
      maxRetries: 2,
      stopWhen: stepCountIs(10),
      tools,

      // Stream progress updates for tool executions
      onStepFinish: async ({ toolCalls, toolResults }) => {
        console.log('[Chat API] Step finished with', toolCalls?.length || 0, 'tool calls');

        // Emit start markers for new tools
        if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
            if (!activeTools.has(call.toolName)) {
              activeTools.add(call.toolName);
              toolStartTimes[call.toolName] = Date.now();
              const displayName = TOOL_DISPLAY_NAMES[call.toolName] || call.toolName;
              // Emit simplified [WORK:tool:description] marker
              await writeProgress(`[WORK:${call.toolName}:${displayName}]\n`);
              console.log(`[Chat API] 🔧 Executing: ${call.toolName}`);
            }
          }
        }

        // Emit completion markers with duration
        if (toolResults && toolResults.length > 0) {
          for (const toolResult of toolResults) {
            if (!completedTools.has(toolResult.toolName)) {
              completedTools.add(toolResult.toolName);
              const rawDuration = toolStartTimes[toolResult.toolName]
                ? (Date.now() - toolStartTimes[toolResult.toolName]) / 1000
                : 0;
              // Show minimum 0.5s for very fast tools to feel more responsive
              const displayDuration = rawDuration < 0.5 ? '' : rawDuration.toFixed(1);
              const duration = displayDuration;

              // Check if the tool result indicates failure
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = (toolResult as any).result as { success?: boolean; error?: string } | undefined;
              if (result && result.success === false) {
                // Emit error marker for failed tools
                const errorMessage = result.error || 'Unknown error';
                await writeProgress(`[WORK_ERROR:${toolResult.toolName}:${errorMessage}]\n`);
                console.log(`[Chat API] ❌ Failed: ${toolResult.toolName} - ${errorMessage}`);
              } else {
                // Emit simplified [WORK_DONE:tool:duration] marker
                // Only show duration if it was significant (>0.5s)
                const durationDisplay = duration ? `${duration}s` : '';
                await writeProgress(`[WORK_DONE:${toolResult.toolName}:${durationDisplay}]\n`);
                console.log(`[Chat API] ✅ Completed: ${toolResult.toolName}${duration ? ` (${duration}s)` : ''}`);
              }
            }
          }
        }
      },

      // Save assistant message when complete
      onFinish: async ({ text, toolCalls, finishReason }) => {
        console.log('[Chat API] Stream finished:', finishReason);
        console.log('[Chat API] Tool calls:', toolCalls?.length || 0);

        // Generate content from text or tool calls
        let content = text || '';

        // Save to database
        const finalContent = content ||
          (toolCalls && toolCalls.length > 0
            ? `Executed: ${toolCalls.map(t => t.toolName).join(', ')}`
            : '');

        if (finalContent) {
          const { error: assistantMsgError } = await (supabase.from('messages') as any).insert({
            id: assistantMessageId, // Use client-generated ID for deduplication
            project_id: projectId,
            role: 'assistant',
            content: finalContent,
            metadata: {
              toolCount: toolCalls?.length || 0,
              finishReason,
            },
          });

          if (assistantMsgError) {
            console.error('[DB] Assistant message save failed:', assistantMsgError);
          } else {
            console.log('[DB] ✅ Saved assistant message');
          }
        }

        // Close the progress writer
        await progressWriter.close();
      },
    });

    // Merge the AI text stream with our progress stream
    const aiStream = result.textStream;

    // Create a combined stream that includes both progress and AI text
    const combinedStream = new ReadableStream({
      async start(controller) {
        const aiReader = aiStream.getReader();
        const progressReader = progressStream.readable.getReader();

        // Read from both streams
        const readAI = async () => {
          try {
            while (true) {
              const { done, value } = await aiReader.read();
              if (done) break;
              controller.enqueue(encoder.encode(value));
            }
          } catch (e) {
            console.error('[Stream] AI stream error:', e);
          }
        };

        const readProgress = async () => {
          try {
            while (true) {
              const { done, value } = await progressReader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error('[Stream] Progress stream error:', e);
          }
        };

        // Run both readers concurrently
        await Promise.all([readAI(), readProgress()]);
        controller.close();
      },
    });

    return new Response(combinedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
