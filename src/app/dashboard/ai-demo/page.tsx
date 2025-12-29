import { Metadata } from 'next';
import { AIMappingDemo } from './ai-mapping-demo';

export const metadata: Metadata = {
  title: 'AI Field Mapping Demo | Rule Engine',
  description: 'Test AI-powered field mapping between integrations',
};

export default function AIDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Field Mapping Demo</h1>
        <p className="text-gray-600">
          Test the AI-powered field mapping feature. The AI will analyze schemas and suggest intelligent mappings.
        </p>
      </div>

      <AIMappingDemo />
    </div>
  );
}

