import Anthropic from '@anthropic-ai/sdk';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface KnowledgeBaseArticle {
  title: string;
  content: string;
  category?: string;
}

export interface ChatbotConfig {
  botName: string;
  greetingMessage: string;
  tone: string;
  customInstructions?: string;
  enableFaq: boolean;
  enableLeadQual: boolean;
  enableScheduling: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatResponse {
  message: string;
  inputTokens: number;
  outputTokens: number;
}

// Tool definitions for appointment scheduling
const schedulingTools: Anthropic.Tool[] = [
  {
    name: 'get_appointment_types',
    description: 'Get the list of available appointment types that can be booked. Use this when a user wants to schedule an appointment to see what options are available.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'check_availability',
    description: 'Check available time slots for a specific date and appointment type. Use this when a user mentions a specific day they want to book.',
    input_schema: {
      type: 'object',
      properties: {
        appointmentTypeId: {
          type: 'string',
          description: 'The ID of the appointment type to check availability for',
        },
        date: {
          type: 'string',
          description: 'The date to check availability for in YYYY-MM-DD format',
        },
      },
      required: ['appointmentTypeId', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment at a specific time. Only use this after confirming the visitor\'s name, email, phone number, and preferred time slot.',
    input_schema: {
      type: 'object',
      properties: {
        appointmentTypeId: {
          type: 'string',
          description: 'The ID of the appointment type',
        },
        startTime: {
          type: 'string',
          description: 'The start time of the appointment in ISO 8601 format',
        },
        visitorName: {
          type: 'string',
          description: 'The full name of the visitor',
        },
        visitorEmail: {
          type: 'string',
          description: 'The email address of the visitor',
        },
        visitorPhone: {
          type: 'string',
          description: 'The phone number of the visitor (required)',
        },
        notes: {
          type: 'string',
          description: 'Any additional notes or comments from the visitor (optional)',
        },
      },
      required: ['appointmentTypeId', 'startTime', 'visitorName', 'visitorEmail', 'visitorPhone'],
    },
  },
];

export async function generateChatResponse(
  apiKey: string,
  config: ChatbotConfig,
  messages: Message[],
  knowledgeBase: KnowledgeBaseArticle[],
  businessName: string,
  widgetId: string,
  timezone: string,
  baseUrl: string
): Promise<ChatResponse> {
  const anthropic = new Anthropic({
    apiKey,
  });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(config, knowledgeBase, businessName, timezone);

  // Convert simple messages to Anthropic format (text only for now)
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalMessage = '';

  // Tool use loop - continue until we get a text response
  let currentMessages = anthropicMessages;
  const maxIterations = 5; // Prevent infinite loops
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`[Claude] Iteration ${iteration}, messages:`, currentMessages.length);

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: systemPrompt,
        messages: currentMessages,
        tools: config.enableScheduling ? schedulingTools : undefined,
      });

      console.log(`[Claude] Response received, stop_reason: ${response.stop_reason}`);

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      // Check if we got a text response
      const textContent = response.content.find((block) => block.type === 'text');
      if (textContent && textContent.type === 'text') {
        finalMessage = textContent.text;
      }

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

      if (toolUseBlocks.length === 0) {
        // No tools used, we're done
        console.log('[Claude] No tools used, finishing');
        break;
      }

      console.log(`[Claude] Executing ${toolUseBlocks.length} tools`);

      // Execute tools and prepare results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.type !== 'tool_use') continue;

        console.log(`[Claude] Executing tool: ${toolUse.name}`);
        let toolResult: any;

        try {
          if (toolUse.name === 'get_appointment_types') {
            toolResult = await getAppointmentTypes(widgetId, baseUrl);
          } else if (toolUse.name === 'check_availability') {
            const { appointmentTypeId, date } = toolUse.input as any;
            toolResult = await checkAvailability(widgetId, appointmentTypeId, date, baseUrl);
          } else if (toolUse.name === 'book_appointment') {
            const bookingData = toolUse.input as any;
            toolResult = await bookAppointment(widgetId, timezone, bookingData, baseUrl);
          } else {
            toolResult = { error: 'Unknown tool' };
          }

          console.log(`[Claude] Tool ${toolUse.name} result:`, toolResult);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult),
          });
        } catch (error: any) {
          console.error(`[Claude] Error executing tool ${toolUse.name}:`, error);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: error.message || 'Tool execution failed' }),
            is_error: true,
          });
        }
      }

      // Add assistant's response and tool results to conversation
      currentMessages = [
        ...currentMessages,
        {
          role: 'assistant',
          content: response.content,
        },
        {
          role: 'user',
          content: toolResults,
        },
      ];
    } catch (error: any) {
      console.error('[Claude] Error in iteration:', error);
      throw error;
    }
  }

  return {
    message: finalMessage || 'I apologize, but I encountered an error processing your request.',
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
  };
}

function buildSystemPrompt(
  config: ChatbotConfig,
  knowledgeBase: KnowledgeBaseArticle[],
  businessName: string,
  timezone: string
): string {
  let prompt = `You are ${config.botName}, an AI assistant for ${businessName}.\n\n`;

  // Current date/time information
  const now = new Date();

  // Format the full date display
  const currentDate = now.toLocaleDateString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // Get YYYY-MM-DD in the correct timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const currentDateISO = formatter.format(now); // Returns YYYY-MM-DD

  prompt += `CURRENT DATE AND TIME:\n`;
  prompt += `Today is ${currentDate}.\n`;
  prompt += `The current date in YYYY-MM-DD format is: ${currentDateISO}\n`;
  prompt += `The timezone is ${timezone}.\n`;
  prompt += `When calculating future dates like "Friday" or "next Monday", use the date above as your reference point.\n\n`;

  // Tone
  const toneInstructions = {
    professional: 'Maintain a professional and courteous tone in all interactions.',
    friendly: 'Be warm, friendly, and approachable while remaining helpful.',
    casual: 'Use a casual, conversational tone that feels natural and relaxed.',
  };
  prompt += `${toneInstructions[config.tone as keyof typeof toneInstructions]}\n\n`;

  // Custom instructions
  if (config.customInstructions) {
    prompt += `Additional Instructions:\n${config.customInstructions}\n\n`;
  }

  // Capabilities
  prompt += 'Your capabilities include:\n';

  if (config.enableFaq && knowledgeBase.length > 0) {
    prompt += '- Answering questions using the knowledge base provided below\n';
  }

  if (config.enableLeadQual) {
    prompt += '- Qualifying leads by asking relevant questions about their needs\n';
  }

  if (config.enableScheduling) {
    prompt += '- Helping visitors schedule appointments using the available tools\n';
  }

  prompt += '\n';

  // Knowledge base
  if (config.enableFaq && knowledgeBase.length > 0) {
    prompt += 'KNOWLEDGE BASE:\n';
    prompt += 'Use this information to answer visitor questions. If the answer is not in the knowledge base, politely say so and offer to help in another way.\n\n';

    knowledgeBase.forEach((article) => {
      prompt += `## ${article.title}\n`;
      if (article.category) {
        prompt += `Category: ${article.category}\n`;
      }
      prompt += `${article.content}\n\n`;
    });
  }

  // Guidelines
  prompt += 'GUIDELINES:\n';
  prompt += '- Keep responses concise and helpful\n';
  prompt += '- If you don\'t know something, be honest about it\n';
  prompt += '- Be respectful and professional at all times\n';
  prompt += '- Focus on helping the visitor achieve their goals\n';

  if (config.enableScheduling) {
    prompt += `\nAPPOINTMENT SCHEDULING:\n`;
    prompt += `- Business timezone: ${timezone}\n`;
    prompt += '- To help a visitor book an appointment:\n\n';
    prompt += 'Step 1: Get appointment types\n';
    prompt += '  - Use get_appointment_types tool to see available services\n\n';
    prompt += 'Step 2: Understand their date preference\n';
    prompt += '  - Use the current date above to calculate "tomorrow", "Friday", "next Monday", etc.\n';
    prompt += '  - Convert relative dates to YYYY-MM-DD format\n\n';
    prompt += 'Step 3: Check and present availability\n';
    prompt += '  - Use check_availability tool with the date in YYYY-MM-DD format\n';
    prompt += '  - If the date has no availability, proactively check the next 2-3 business days\n';
    prompt += '  - Present available dates and times from those that have openings\n';
    prompt += '  - ALWAYS show ALL available times from availableSlots array using startLocal field\n';
    prompt += '  - DO NOT ask the user what dates to check - be proactive and show what\'s available\n\n';
    prompt += 'Step 4: Let them choose\n';
    prompt += '  - Let the visitor pick a date and time from what you showed\n';
    prompt += '  - Be flexible with time formats - "11am" matches "11:00 AM"\n\n';
    prompt += 'Step 5: Collect information\n';
    prompt += '  - Collect: name, email, phone number (all required)\n\n';
    prompt += 'Step 6: Book the appointment\n';
    prompt += '  - Use book_appointment tool with the "start" ISO timestamp from the chosen slot\n\n';
    prompt += 'Step 7: Confirm\n';
    prompt += '  - Confirm booking with date, time (in local format), and timezone\n\n';
    prompt += 'IMPORTANT TIPS:\n';
    prompt += '- If a requested date has no availability, immediately check nearby dates and show what IS available\n';
    prompt += '- When asked "what days are available?", check the next 5-7 days and list which ones have openings\n';
    prompt += '- Always be proactive - don\'t make the user guess what dates to try\n';
  }

  if (config.enableLeadQual) {
    prompt += '- Gather relevant information about visitor needs to qualify them as leads\n';
    prompt += '- Ask thoughtful follow-up questions to understand their requirements\n';
  }

  return prompt;
}

// Tool implementation functions

async function getAppointmentTypes(widgetId: string, baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/appointment-types?widgetId=${widgetId}`);

    if (!response.ok) {
      return { error: 'Failed to fetch appointment types' };
    }

    const data = await response.json();
    return {
      appointmentTypes: data.appointmentTypes.map((apt: any) => ({
        id: apt.id,
        name: apt.name,
        description: apt.description,
        duration: apt.duration,
      })),
    };
  } catch (error: any) {
    console.error('Error fetching appointment types:', error);
    return { error: error.message };
  }
}

async function checkAvailability(widgetId: string, appointmentTypeId: string, date: string, baseUrl: string) {
  try {
    const response = await fetch(
      `${baseUrl}/api/availability/slots?widgetId=${widgetId}&appointmentTypeId=${appointmentTypeId}&startDate=${date}&endDate=${date}`
    );

    if (!response.ok) {
      return { error: 'Failed to check availability' };
    }

    const data = await response.json();

    if (!data.slots || data.slots.length === 0) {
      return { error: 'No availability data found for this date' };
    }

    const daySlots = data.slots[0];
    const availableSlots = daySlots.slots.filter((slot: any) => slot.available);
    const unavailableSlots = daySlots.slots.filter((slot: any) => !slot.available);

    return {
      date: daySlots.date,
      timezone: data.timezone,
      appointmentType: data.appointmentType,
      availableSlots: availableSlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end,
      })),
      unavailableSlots: unavailableSlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end,
      })),
      totalAvailable: availableSlots.length,
      totalUnavailable: unavailableSlots.length,
    };
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return { error: error.message };
  }
}

async function bookAppointment(widgetId: string, timezone: string, bookingData: any, baseUrl: string) {
  try {
    const payload = {
      widgetId,
      timezone,
      ...bookingData,
    };

    console.log('[bookAppointment] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${baseUrl}/api/appointments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[bookAppointment] Error response:', errorData);
      return {
        error: errorData.error || 'Failed to book appointment',
        details: errorData.details || undefined
      };
    }

    const data = await response.json();
    console.log('[bookAppointment] Success:', data);
    return {
      success: true,
      appointment: data.appointment,
    };
  } catch (error: any) {
    console.error('[bookAppointment] Exception:', error);
    return { error: error.message };
  }
}
