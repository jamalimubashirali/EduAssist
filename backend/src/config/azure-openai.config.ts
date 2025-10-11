import { AzureChatOpenAI } from '@langchain/openai';

export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
}

export function createAzureChatModel(): AzureChatOpenAI {
  const config: AzureOpenAIConfig = {
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o-mini',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
  };

  // Validate required environment variables
  if (!config.apiKey) {
    throw new Error('AZURE_OPENAI_API_KEY environment variable is required');
  }
  if (!config.endpoint) {
    throw new Error('AZURE_OPENAI_ENDPOINT environment variable is required');
  }

  return new AzureChatOpenAI({
    azureOpenAIApiKey: config.apiKey,
    azureOpenAIApiInstanceName: extractInstanceName(config.endpoint),
    azureOpenAIApiDeploymentName: config.deploymentName,
    azureOpenAIApiVersion: config.apiVersion,
    temperature: 0.7,
    maxTokens: 1000,
  });
}

/**
 * Extract instance name from Azure OpenAI endpoint URL
 * Example: https://your-resource-name.openai.azure.com/ -> your-resource-name
 */
function extractInstanceName(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    const hostname = url.hostname;
    return hostname.split('.')[0];
  } catch (error) {
    throw new Error(`Invalid Azure OpenAI endpoint format: ${endpoint}`);
  }
}
