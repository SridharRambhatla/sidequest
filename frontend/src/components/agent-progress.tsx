'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Globe, 
  Users, 
  BookOpen, 
  Wallet,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { AgentState, AgentStatus, AGENTS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AgentProgressProps {
  agentStates: AgentState[];
  overallProgress: number;
  currentMessage?: string;
  className?: string;
}

const agentIcons: Record<string, React.ElementType> = {
  discovery: Search,
  cultural_context: Globe,
  community: Users,
  plot_builder: BookOpen,
  budget: Wallet,
};

const statusColors: Record<AgentStatus, string> = {
  waiting: 'text-muted-foreground bg-muted',
  processing: 'text-primary bg-primary/10',
  success: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  error: 'text-destructive bg-destructive/10',
};

const statusBorderColors: Record<AgentStatus, string> = {
  waiting: 'border-muted',
  processing: 'border-primary',
  success: 'border-green-500',
  error: 'border-destructive',
};

function AgentCard({ agent }: { agent: AgentState }) {
  const Icon = agentIcons[agent.name] || Search;
  const isProcessing = agent.status === 'processing';
  const isSuccess = agent.status === 'success';
  const isError = agent.status === 'error';

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'border-2',
        statusBorderColors[agent.status],
        isProcessing && 'shadow-md shadow-primary/20'
      )}
    >
      <CardContent className="p-4">
        {/* Icon and status indicator */}
        <div className="flex items-start justify-between mb-3">
          <div 
            className={cn(
              'p-2 rounded-lg transition-colors',
              statusColors[agent.status]
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSuccess ? (
              <Check className="h-5 w-5" />
            ) : isError ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          
          {/* Progress percentage */}
          <span 
            className={cn(
              'text-sm font-medium',
              agent.status === 'waiting' && 'text-muted-foreground',
              agent.status === 'processing' && 'text-primary',
              agent.status === 'success' && 'text-green-600 dark:text-green-400',
              agent.status === 'error' && 'text-destructive'
            )}
          >
            {agent.progress}%
          </span>
        </div>

        {/* Agent name */}
        <h4 className="font-semibold text-sm mb-1">
          {agent.displayName}
        </h4>

        {/* Status message or description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {agent.message || agent.description}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              agent.status === 'waiting' && 'bg-muted-foreground/30',
              agent.status === 'processing' && 'bg-primary',
              agent.status === 'success' && 'bg-green-500',
              agent.status === 'error' && 'bg-destructive'
            )}
            style={{ width: `${agent.progress}%` }}
          />
        </div>

        {/* Processing animation overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-progress pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
}

export function AgentProgress({ 
  agentStates, 
  overallProgress, 
  currentMessage,
  className 
}: AgentProgressProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Creating your Sidequest...
        </h2>
        <p className="text-muted-foreground">
          {currentMessage || 'Our AI agents are crafting your perfect experience'}
        </p>
      </div>

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {agentStates.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </div>

      {/* Fun facts during loading */}
      <LoadingFacts />
    </div>
  );
}

// Fun facts carousel during loading
function LoadingFacts() {
  const facts = [
    "Did you know? Bangalore has over 10,000 restaurants serving cuisines from around the world.",
    "Fun fact: Pottery workshops have seen a 300% increase in solo attendees since 2023.",
    "The #BangaloreRunClub community has over 50,000 active members.",
    "India's coffee culture started in Karnataka in the 17th century.",
    "Bangalore hosts more than 200 cultural events every month.",
    "Cubbon Park spans 300 acres right in the heart of the city.",
  ];

  const [currentFact, setCurrentFact] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [facts.length]);

  return (
    <div className="mt-8 p-4 bg-muted/50 rounded-lg">
      <p className="text-sm text-center text-muted-foreground animate-fade-in" key={currentFact}>
        {facts[currentFact]}
      </p>
    </div>
  );
}

// Hook to simulate agent progress for demo
export function useAgentProgress(isGenerating: boolean) {
  const [agentStates, setAgentStates] = useState<AgentState[]>(
    AGENTS.map((agent) => ({
      name: agent.name,
      displayName: agent.displayName,
      description: agent.description,
      status: 'waiting' as AgentStatus,
      progress: 0,
    }))
  );
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (!isGenerating) {
      // Reset states
      setAgentStates(
        AGENTS.map((agent) => ({
          name: agent.name,
          displayName: agent.displayName,
          description: agent.description,
          status: 'waiting' as AgentStatus,
          progress: 0,
        }))
      );
      setOverallProgress(0);
      setCurrentMessage('');
      return;
    }

    // Simulate agent progression
    const timeline = [
      { agent: 'discovery', start: 0, duration: 3000, message: 'Discovering experiences from local sources...' },
      { agent: 'cultural_context', start: 2500, duration: 3500, message: 'Adding cultural context and timing...' },
      { agent: 'community', start: 2500, duration: 3000, message: 'Analyzing solo-friendliness...' },
      { agent: 'plot_builder', start: 5500, duration: 4000, message: 'Crafting your narrative journey...' },
      { agent: 'budget', start: 8000, duration: 2000, message: 'Calculating costs and finding deals...' },
    ];

    const startTime = Date.now();
    const totalDuration = 10000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / totalDuration) * 100, 100);
      setOverallProgress(Math.round(progress));

      // Update individual agent states
      setAgentStates((prev) =>
        prev.map((agent) => {
          const timelineEntry = timeline.find((t) => t.agent === agent.name);
          if (!timelineEntry) return agent;

          const agentElapsed = elapsed - timelineEntry.start;
          
          if (agentElapsed < 0) {
            return { ...agent, status: 'waiting' as AgentStatus, progress: 0 };
          } else if (agentElapsed < timelineEntry.duration) {
            const agentProgress = Math.min((agentElapsed / timelineEntry.duration) * 100, 100);
            return { 
              ...agent, 
              status: 'processing' as AgentStatus, 
              progress: Math.round(agentProgress),
              message: timelineEntry.message
            };
          } else {
            return { ...agent, status: 'success' as AgentStatus, progress: 100 };
          }
        })
      );

      // Update current message
      const activeAgent = timeline.find(
        (t) => elapsed >= t.start && elapsed < t.start + t.duration
      );
      if (activeAgent) {
        setCurrentMessage(activeAgent.message);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
        setOverallProgress(100);
        setCurrentMessage('Almost done...');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return { agentStates, overallProgress, currentMessage };
}
