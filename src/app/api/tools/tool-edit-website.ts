import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createClient } from '@supabase/supabase-js';
import { parseHTML } from 'linkedom';
import type { WebsiteArtifact } from '@/types/database';

// ============================================
// TYPES
// ============================================

export interface CodeChange {
  file: string;
  description: string;
  before?: string;
  after?: string;
}

export interface ProgressUpdate {
  type: 'stage' | 'change';
  stage?: string;
  message?: string;
  file?: string;
  description?: string;
  before?: string;
  after?: string;
}

type ProgressCallback = (update: ProgressUpdate) => Promise<void>;

interface HTMLEdit {
  selector: string;
  action: 'style' | 'text' | 'attribute' | 'addClass' | 'removeClass';
  property?: string;
  value: string;
  description?: string;
}

interface CSSEdit {
  selector: string;
  property: string;
  value: string;
  description?: string;
}

interface EditResponse {
  htmlEdits?: HTMLEdit[];
  cssEdits?: CSSEdit[];
}

// ============================================
// SCHEMA DEFINITION
// ============================================

export const editWebsiteSchema = z.object({
  editInstructions: z.string().describe('What changes to make to the website (e.g., "change button color to blue", "make hero section taller")'),
});

// ============================================
// HELPER: Extract useful context from HTML
// ============================================

function extractHTMLContext(html: string): string {
  const context: string[] = [];

  // Get all class names used
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  const classes = [...new Set(classMatches.map(m => m.replace('class="', '').replace('"', '')))];
  if (classes.length > 0) {
    context.push(`CSS Classes: ${classes.slice(0, 30).join(', ')}`);
  }

  // Get all IDs
  const idMatches = html.match(/id="([^"]+)"/g) || [];
  const ids = [...new Set(idMatches.map(m => m.replace('id="', '').replace('"', '')))];
  if (ids.length > 0) {
    context.push(`IDs: ${ids.slice(0, 20).join(', ')}`);
  }

  // Get button texts
  const buttons = html.match(/<button[^>]*>([^<]+)<\/button>/g) || [];
  if (buttons.length > 0) {
    context.push(`Buttons: ${buttons.slice(0, 5).join(', ')}`);
  }

  // Get headings
  const h1s = html.match(/<h1[^>]*>([^<]*)<\/h1>/g) || [];
  const h2s = html.match(/<h2[^>]*>([^<]*)<\/h2>/g) || [];
  if (h1s.length > 0 || h2s.length > 0) {
    context.push(`Headings: ${[...h1s, ...h2s].slice(0, 5).join(', ')}`);
  }

  // Get links
  const links = html.match(/<a[^>]*>([^<]*)<\/a>/g) || [];
  if (links.length > 0) {
    context.push(`Links: ${links.slice(0, 5).join(', ')}`);
  }

  return context.join('\n');
}

// ============================================
// HELPER: Escape regex special characters
// ============================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// APPLY HTML EDITS using DOM
// ============================================

function applyHTMLEdits(html: string, edits: HTMLEdit[]): { html: string; applied: CodeChange[] } {
  const { document } = parseHTML(html);
  const applied: CodeChange[] = [];

  for (const edit of edits) {
    try {
      const elements = document.querySelectorAll(edit.selector);

      if (elements.length === 0) {
        console.warn(`[Edit Website] No elements found for selector: ${edit.selector}`);
        continue;
      }

      for (const el of elements) {
        const beforeState = el.outerHTML?.substring(0, 50) || '';

        switch (edit.action) {
          case 'style':
            if (edit.property) {
              (el as any).style[edit.property] = edit.value;
            }
            break;
          case 'text':
            el.textContent = edit.value;
            break;
          case 'attribute':
            if (edit.property) {
              el.setAttribute(edit.property, edit.value);
            }
            break;
          case 'addClass':
            el.classList.add(edit.value);
            break;
          case 'removeClass':
            el.classList.remove(edit.value);
            break;
        }

        const afterState = el.outerHTML?.substring(0, 50) || '';

        applied.push({
          file: '/index.html',
          description: edit.description || `${edit.action} on ${edit.selector}`,
          before: beforeState,
          after: afterState,
        });
      }

      console.log(`[Edit Website] ✓ Applied ${edit.action} to ${elements.length} element(s): ${edit.selector}`);
    } catch (err) {
      console.error(`[Edit Website] Error applying edit to ${edit.selector}:`, err);
    }
  }

  return { html: document.toString(), applied };
}

// ============================================
// APPLY CSS EDITS
// ============================================

function applyCSSEdits(css: string, edits: CSSEdit[]): { css: string; applied: CodeChange[] } {
  let result = css;
  const applied: CodeChange[] = [];

  for (const edit of edits) {
    try {
      const escapedSelector = escapeRegex(edit.selector);
      const selectorRegex = new RegExp(
        `(${escapedSelector}\\s*\\{[^}]*)\\}`,
        'g'
      );

      const beforeCSS = result.substring(0, 100);

      if (result.match(selectorRegex)) {
        // Selector exists - add/update property
        result = result.replace(selectorRegex, (match, block) => {
          const propRegex = new RegExp(`${escapeRegex(edit.property)}\\s*:[^;]+;?`, 'g');
          if (block.match(propRegex)) {
            // Property exists - update it
            return block.replace(propRegex, `${edit.property}: ${edit.value};`) + '}';
          } else {
            // Add new property before closing brace
            return block.trimEnd() + `\n  ${edit.property}: ${edit.value};\n}`;
          }
        });
      } else {
        // Selector doesn't exist - add new rule at the end
        result += `\n\n${edit.selector} {\n  ${edit.property}: ${edit.value};\n}`;
      }

      applied.push({
        file: '/styles.css',
        description: edit.description || `Set ${edit.property} on ${edit.selector}`,
        before: beforeCSS,
        after: result.substring(0, 100),
      });

      console.log(`[Edit Website] ✓ Applied CSS: ${edit.selector} { ${edit.property}: ${edit.value} }`);
    } catch (err) {
      console.error(`[Edit Website] Error applying CSS edit:`, err);
    }
  }

  return { css: result, applied };
}

// ============================================
// TOOL IMPLEMENTATION - DOM-BASED EDITING
// ============================================

export async function editWebsiteFiles(params: z.infer<typeof editWebsiteSchema> & { projectId: string; onProgress?: ProgressCallback }) {
  const { editInstructions, projectId, onProgress } = params;

  try {
    console.log('[Edit Website] 🔧 Starting DOM-based website edit...');
    console.log('[Edit Website] Instructions:', editInstructions);

    // Stage 1: Fetching current files
    await onProgress?.({ type: 'stage', stage: 'fetch', message: 'Loading website...' });

    // 1. Fetch current website artifact from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: artifact, error: fetchError } = await (supabase
      .from('artifacts') as any)
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'website_code')
      .single();

    if (fetchError || !artifact) {
      console.error('[Edit Website] No existing website found:', fetchError);
      throw new Error('No website found to edit. Generate a website first.');
    }

    const currentWebsite = artifact.data as WebsiteArtifact;
    const htmlFile = currentWebsite.files.find(f => f.path === '/index.html');
    const cssFile = currentWebsite.files.find(f => f.path === '/styles.css');

    if (!htmlFile) {
      throw new Error('Website has no HTML file');
    }

    console.log('[Edit Website] Files loaded, using DOM-based approach');

    // Stage 2: Generate changes
    await onProgress?.({ type: 'stage', stage: 'analyze', message: 'Planning changes...' });

    // 2. Initialize OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });

    // Use Claude 3.5 Sonnet for reliable selector generation
    const selectedModel = 'anthropic/claude-3.5-sonnet';
    console.log('[Edit Website] Using model:', selectedModel);

    // 3. Build the DOM-BASED prompt
    const prompt = `You are making targeted edits to a website using CSS selectors.

USER REQUEST: "${editInstructions}"

WEBSITE STRUCTURE:
${extractHTMLContext(htmlFile.content)}

Return ONLY a JSON object (no markdown, no explanation) with edits to make:

{
  "htmlEdits": [
    {
      "selector": "CSS selector to target element(s)",
      "action": "style | text | attribute | addClass | removeClass",
      "property": "for style: CSS property name, for attribute: attribute name",
      "value": "new value",
      "description": "brief description"
    }
  ],
  "cssEdits": [
    {
      "selector": "CSS selector (e.g., button, .class, #id)",
      "property": "CSS property",
      "value": "new value",
      "description": "brief description"
    }
  ]
}

COMMON PATTERNS:
- Round buttons: {"htmlEdits": [{"selector": "button, .btn, a.button, [type='submit']", "action": "style", "property": "borderRadius", "value": "9999px", "description": "Round all buttons"}]}
- Bigger text: {"htmlEdits": [{"selector": "h1", "action": "style", "property": "fontSize", "value": "4rem", "description": "Increase heading size"}]}
- Change text: {"htmlEdits": [{"selector": ".hero h1, h1", "action": "text", "value": "New Headline", "description": "Update heading text"}]}
- Darker background: {"cssEdits": [{"selector": "body", "property": "background-color", "value": "#1a1a2e", "description": "Darken background"}]}
- Button color: {"cssEdits": [{"selector": "button, .btn", "property": "background-color", "value": "#3b82f6", "description": "Change button color"}]}
- More padding: {"htmlEdits": [{"selector": ".hero, section", "action": "style", "property": "padding", "value": "80px 20px", "description": "Increase section padding"}]}

RULES:
1. Use broad selectors to catch all matching elements (e.g., "button, .btn, a.button")
2. For style changes, use camelCase property names (borderRadius, not border-radius)
3. For CSS edits, use kebab-case (background-color)
4. Return 1-5 edits maximum
5. Return ONLY valid JSON, nothing else

JSON:`;

    // 4. Get AI response
    await onProgress?.({ type: 'stage', stage: 'generate', message: 'Generating changes...' });

    const { text } = await generateText({
      model: openrouter(selectedModel),
      prompt,
      temperature: 0.1,
      maxOutputTokens: 1000,
    });

    console.log('[Edit Website] AI response:', text.substring(0, 300));

    // Stage 3: Apply changes
    await onProgress?.({ type: 'stage', stage: 'apply', message: 'Applying changes...' });

    // 5. Parse the response
    let editResponse: EditResponse = { htmlEdits: [], cssEdits: [] };
    try {
      let jsonString = text.trim();

      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      } else {
        // Find JSON object directly
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonString = objMatch[0];
        }
      }

      editResponse = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[Edit Website] Failed to parse response:', parseError);
      console.error('[Edit Website] Raw text:', text);
      throw new Error('Failed to parse AI response. Try rephrasing your edit request.');
    }

    const htmlEdits = editResponse.htmlEdits || [];
    const cssEdits = editResponse.cssEdits || [];

    if (htmlEdits.length === 0 && cssEdits.length === 0) {
      throw new Error('No changes detected. Try being more specific about what to change.');
    }

    console.log(`[Edit Website] Applying ${htmlEdits.length} HTML edits and ${cssEdits.length} CSS edits`);

    // 6. Apply edits
    const allChanges: CodeChange[] = [];
    const updatedFiles = [...currentWebsite.files];

    // Apply HTML edits
    if (htmlEdits.length > 0) {
      const htmlIndex = updatedFiles.findIndex(f => f.path === '/index.html');
      if (htmlIndex !== -1) {
        const { html: newHtml, applied } = applyHTMLEdits(updatedFiles[htmlIndex].content, htmlEdits);
        updatedFiles[htmlIndex].content = newHtml;
        allChanges.push(...applied);

        for (const change of applied) {
          await onProgress?.({
            type: 'change',
            file: change.file,
            description: change.description,
            before: change.before,
            after: change.after,
          });
        }
      }
    }

    // Apply CSS edits
    if (cssEdits.length > 0 && cssFile) {
      const cssIndex = updatedFiles.findIndex(f => f.path === '/styles.css');
      if (cssIndex !== -1) {
        const { css: newCss, applied } = applyCSSEdits(updatedFiles[cssIndex].content, cssEdits);
        updatedFiles[cssIndex].content = newCss;
        allChanges.push(...applied);

        for (const change of applied) {
          await onProgress?.({
            type: 'change',
            file: change.file,
            description: change.description,
            before: change.before,
            after: change.after,
          });
        }
      }
    }

    if (allChanges.length === 0) {
      throw new Error('Could not apply any changes. The selectors may not match any elements.');
    }

    // Stage 4: Save
    await onProgress?.({ type: 'stage', stage: 'save', message: 'Saving...' });

    // 7. Save updated artifact
    const updatedWebsite: WebsiteArtifact = {
      files: updatedFiles,
      primaryPage: '/index.html',
    };

    const { error: saveError } = await (supabase
      .from('artifacts') as any)
      .update({
        data: updatedWebsite,
        version: (artifact.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('type', 'website_code');

    if (saveError) {
      console.error('[Edit Website] Failed to save:', saveError);
      throw new Error('Failed to save website updates');
    }

    console.log(`[Edit Website] ✅ Done! Applied ${allChanges.length} changes`);

    return {
      success: true,
      changesApplied: allChanges.length,
      changes: allChanges,
      summary: `✏️ Made ${allChanges.length} change${allChanges.length > 1 ? 's' : ''}: ${allChanges.map(c => c.description).join(', ')}`,
    };
  } catch (error) {
    console.error('[Edit Website] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
