import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatSession,
  ChatSessionDocument,
} from './schemas/chat-session.schema';
import { PerformanceService } from '../../performance/performance.service';
import { createAzureChatModel } from '../../config/azure-openai.config';
import {
  ChatResponse,
  LearningContext,
} from './interfaces/chat-response.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LearningAssistantService {
  private readonly logger = new Logger(LearningAssistantService.name);
  private readonly WEAK_TOPIC_THRESHOLD = 60; // Below 60% accuracy is considered weak

  constructor(
    private readonly performanceService: PerformanceService,
    @InjectModel(ChatSession.name)
    private chatModel: Model<ChatSessionDocument>,
  ) { }

  async generateResponse(
    userId: string,
    message: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    try {
      // Get or create chat session
      const session = await this.getOrCreateSession(userId, sessionId);

      // Build learning context from user performance
      const context = await this.buildLearningContext(userId);

      // Generate AI response
      const response = await this.callAzureOpenAI(message, context, session);

      // Save conversation to session
      await this.saveConversation(
        session._id.toString(),
        message,
        response,
        context,
      );

      return response;
    } catch (error) {
      this.logger.error(`Error generating response for user ${userId}:`, error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  private async buildLearningContext(userId: string): Promise<LearningContext> {
    try {
      // Get user's topic performances
      const performances =
        await this.performanceService.getUserTopicPerformances(userId);

      if (performances.length === 0) {
        return {
          weakTopics: [],
          strongTopics: [],
          targetScore: 75,
          currentAverageScore: 0,
          recentPerformance: [],
        };
      }

      // Identify weak and strong topics
      const weakTopics = performances
        .filter((p) => p.averageScore < this.WEAK_TOPIC_THRESHOLD)
        .map((p) => (p.topicId as any)?.topicName || 'Unknown Topic')
        .slice(0, 5); // Top 5 weak topics

      const strongTopics = performances
        .filter((p) => p.averageScore >= 80)
        .map((p) => (p.topicId as any)?.topicName || 'Unknown Topic')
        .slice(0, 3); // Top 3 strong topics

      // Calculate overall average
      const currentAverageScore =
        performances.reduce((sum, p) => sum + p.averageScore, 0) /
        performances.length;

      // Get recent performance trends
      const recentPerformance = performances.slice(0, 5).map((p) => ({
        topicName: (p.topicId as any)?.topicName || 'Unknown Topic',
        score: p.averageScore,
        trend: p.progressTrend || 'steady',
      }));

      return {
        weakTopics,
        strongTopics,
        targetScore: 75, // Could be fetched from user preferences
        currentAverageScore: Math.round(currentAverageScore),
        recentPerformance,
      };
    } catch (error) {
      this.logger.error(
        `Error building learning context for user ${userId}:`,
        error,
      );
      return {
        weakTopics: [],
        strongTopics: [],
        targetScore: 75,
        currentAverageScore: 0,
        recentPerformance: [],
      };
    }
  }

  private async callAzureOpenAI(
    message: string,
    context: LearningContext,
    session: ChatSessionDocument,
  ): Promise<ChatResponse> {
    try {
      // Check if Azure OpenAI is configured
      if (!process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY === 'your_azure_api_key_here') {
        this.logger.warn('Azure OpenAI not configured, using fallback response');
        return this.getFallbackResponse(message, context);
      }

      const model = createAzureChatModel();

      // Build context-aware system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Get recent conversation history for context
      const recentMessages = session.messages.slice(-6); // Last 6 messages for context

      // Build messages array for chat completion
      const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add conversation history
      recentMessages.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: message
      });

      // Call the AI model with messages
      const response = await model.invoke(messages);

      // Parse and structure the response
      const responseContent =
        typeof response === 'string'
          ? response
          : (response as any).content || String(response);
      return this.parseAIResponse(responseContent, context);
    } catch (error) {
      this.logger.error('Error calling Azure OpenAI:', error);
      this.logger.warn('Falling back to mock response due to Azure OpenAI error');
      return this.getFallbackResponse(message, context);
    }
  }

  private getFallbackResponse(message: string, context: LearningContext): ChatResponse {
    // Provide a helpful fallback response when Azure OpenAI is not available
    let reply = "## Welcome to your AI Learning Assistant! 🎓\n\n";
    reply += "I'm here to help you with your studies! ";

    if (context.weakTopics.length > 0) {
      reply += "\n\n### Your Areas for Improvement:\n";
      context.weakTopics.slice(0, 3).forEach((topic, index) => {
        reply += `${index + 1}. **${topic}**\n`;
      });
      reply += "\n";
    }

    if (message.toLowerCase().includes('help') || message.toLowerCase().includes('explain')) {
      reply += "I'd be happy to explain concepts **step by step**. ";
    }

    reply += "\n\n> **Note:** The AI service is currently being configured. You can still browse your performance data and recommendations in other sections of the app.\n\n";
    reply += "### What would you like to explore?\n";
    reply += "- Review your **weak areas** for focused study\n";
    reply += "- Get **practice problems** for specific topics\n";
    reply += "- Learn **study strategies** for better retention";

    return {
      reply,
      suggestedTopics: context.weakTopics.slice(0, 3),
      difficulty: context.currentAverageScore < 50 ? 'beginner' : context.currentAverageScore > 80 ? 'advanced' : 'intermediate',
      followUpQuestions: [
        'What specific topic would you like help with?',
        'Would you like to see your performance analytics?'
      ],
      relatedConcepts: context.weakTopics.slice(0, 2)
    };
  }

  private buildSystemPrompt(context: LearningContext): string {
    const { weakTopics, strongTopics, currentAverageScore, targetScore } =
      context;

    let prompt = `You are an AI Learning Tutor for EduAssist, helping students improve their academic performance. 

STUDENT CONTEXT:
- Current average score: ${currentAverageScore}%
- Target score: ${targetScore}%
- Performance gap: ${Math.max(0, targetScore - currentAverageScore)}%`;

    if (weakTopics.length > 0) {
      prompt += `\n- Weak areas needing improvement: ${weakTopics.join(', ')}`;
    }

    if (strongTopics.length > 0) {
      prompt += `\n- Strong areas: ${strongTopics.join(', ')}`;
    }

    prompt += `

TUTORING GUIDELINES:
1. Provide clear, step-by-step explanations with practical examples
2. Focus on weak areas when relevant to the student's question
3. Use encouraging and supportive language
4. Break down complex concepts into digestible parts
5. Suggest practice exercises or study strategies
6. Connect new concepts to the student's strong areas when possible
7. Keep responses concise but comprehensive (max 200 words)
8. Always end with a follow-up question to encourage engagement

RESPONSE FORMAT:
- Use **bold text** for important concepts and key terms
- Use numbered lists (1. 2. 3.) for step-by-step explanations
- Use bullet points (-) for listing related concepts or examples
- Use headings (## Topic Name) to organize longer responses
- Provide helpful explanations and always suggest related topics or follow-up questions to deepen understanding
- Format your response using markdown for better readability`;

    return prompt;
  }

  private parseAIResponse(
    aiResponse: string,
    context: LearningContext,
  ): ChatResponse {
    // Extract suggested topics from weak areas that might be relevant
    const suggestedTopics = context.weakTopics.slice(0, 3);

    // Determine difficulty based on current performance
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (context.currentAverageScore < 50) {
      difficulty = 'beginner';
    } else if (context.currentAverageScore > 80) {
      difficulty = 'advanced';
    }

    // Generate follow-up questions based on context
    const followUpQuestions = this.generateFollowUpQuestions(context);

    return {
      reply: aiResponse.trim(),
      suggestedTopics,
      difficulty,
      followUpQuestions,
      relatedConcepts: context.weakTopics.slice(0, 2),
    };
  }

  private generateFollowUpQuestions(context: LearningContext): string[] {
    const questions: string[] = [];

    if (context.weakTopics.length > 0) {
      questions.push(
        `Would you like me to explain ${context.weakTopics[0]} in more detail?`,
      );
    }

    if (context.currentAverageScore < context.targetScore) {
      questions.push(
        'What specific part of this topic do you find most challenging?',
      );
    }

    questions.push('Would you like some practice problems on this topic?');

    return questions.slice(0, 2);
  }

  private async getOrCreateSession(
    userId: string,
    sessionId?: string,
  ): Promise<ChatSessionDocument> {
    if (sessionId) {
      const existingSession = await this.chatModel.findOne({
        userId,
        sessionId,
        isActive: true,
      });
      if (existingSession) {
        // Update last activity
        existingSession.lastActivity = new Date();
        return await existingSession.save();
      }
    }

    // Create new session
    const newSessionId = sessionId || uuidv4();
    const session = new this.chatModel({
      userId,
      sessionId: newSessionId,
      messages: [],
      contextTopics: [],
      lastActivity: new Date(),
      isActive: true,
    });

    return await session.save();
  }

  private async saveConversation(
    sessionId: string,
    userMessage: string,
    aiResponse: ChatResponse,
    context: LearningContext,
  ): Promise<void> {
    try {
      await this.chatModel.findByIdAndUpdate(sessionId, {
        $push: {
          messages: [
            {
              role: 'user',
              content: userMessage,
              timestamp: new Date(),
            },
            {
              role: 'assistant',
              content: aiResponse.reply,
              timestamp: new Date(),
              metadata: {
                weakTopics: context.weakTopics,
                suggestedTopics: aiResponse.suggestedTopics,
                difficulty: aiResponse.difficulty,
              },
            },
          ],
        },
        $set: {
          lastActivity: new Date(),
          contextTopics: [
            ...new Set([...context.weakTopics, ...context.strongTopics]),
          ],
        },
      });
    } catch (error) {
      this.logger.error('Error saving conversation:', error);
      // Don't throw error as the response was already generated successfully
    }
  }

  async getChatHistory(
    userId: string,
    sessionId: string,
  ): Promise<ChatSessionDocument | null> {
    return await this.chatModel.findOne({ userId, sessionId, isActive: true });
  }

  async getUserSessions(userId: string): Promise<ChatSessionDocument[]> {
    return await this.chatModel
      .find({ userId, isActive: true })
      .sort({ lastActivity: -1 })
      .limit(10);
  }
}
