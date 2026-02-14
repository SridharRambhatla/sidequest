'use client';

import { Cloud, CloudRain, Sun, Umbrella, Home, TreePine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiscoveryExperience } from '@/lib/types';

interface WeatherIndicatorProps {
  experience: DiscoveryExperience;
  showDetails?: boolean;
  compact?: boolean;
}

export default function WeatherIndicator({
  experience,
  showDetails = false,
  compact = false,
}: WeatherIndicatorProps) {
  const { weather_suitability } = experience;

  const getMatchIcon = () => {
    switch (weather_suitability.current_match) {
      case 'perfect':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'good':
        return <Cloud className="h-4 w-4 text-blue-400" />;
      case 'fair':
        return <CloudRain className="h-4 w-4 text-gray-500" />;
      case 'poor':
        return <Umbrella className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getMatchColor = () => {
    switch (weather_suitability.current_match) {
      case 'perfect':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchLabel = () => {
    switch (weather_suitability.current_match) {
      case 'perfect':
        return 'Perfect conditions';
      case 'good':
        return 'Good conditions';
      case 'fair':
        return 'Fair conditions';
      case 'poor':
        return 'Check weather';
      default:
        return 'Unknown';
    }
  };

  const getRainHandling = () => {
    if (weather_suitability.indoor && weather_suitability.outdoor) {
      return {
        icon: <Home className="h-4 w-4" />,
        label: 'Indoor & Outdoor',
        description: 'This experience works in any weather - enjoy rain or shine!',
        rainProof: true,
      };
    }
    if (weather_suitability.indoor) {
      return {
        icon: <Home className="h-4 w-4" />,
        label: 'Indoor Activity',
        description: 'Rain-proof! This is an indoor experience, so weather won\'t affect your plans.',
        rainProof: true,
      };
    }
    return {
      icon: <TreePine className="h-4 w-4" />,
      label: 'Outdoor Activity',
      description: 'This is an outdoor experience. Check the weather forecast before visiting.',
      rainProof: false,
    };
  };

  const rainInfo = getRainHandling();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {getMatchIcon()}
        <span className="text-xs text-muted-foreground capitalize">
          {weather_suitability.current_match}
        </span>
        {rainInfo.rainProof && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            Rain-proof
          </Badge>
        )}
      </div>
    );
  }

  if (!showDetails) {
    return (
      <Badge variant="outline" className={cn('gap-1', getMatchColor())}>
        {getMatchIcon()}
        {getMatchLabel()}
      </Badge>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Current weather match */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                weather_suitability.current_match === 'perfect' && 'bg-green-100',
                weather_suitability.current_match === 'good' && 'bg-blue-100',
                weather_suitability.current_match === 'fair' && 'bg-yellow-100',
                weather_suitability.current_match === 'poor' && 'bg-red-100'
              )}
            >
              {getMatchIcon()}
            </div>
            <div>
              <p className="font-medium">{getMatchLabel()}</p>
              <p className="text-sm text-muted-foreground">
                Based on current weather
              </p>
            </div>
          </div>
          <Badge variant="outline" className={getMatchColor()}>
            {weather_suitability.current_match}
          </Badge>
        </div>

        {/* Rain handling */}
        <div className="border-t border-border pt-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                rainInfo.rainProof ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
              )}
            >
              {rainInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{rainInfo.label}</p>
                {rainInfo.rainProof && (
                  <Badge className="bg-blue-500 text-white text-xs">
                    <Umbrella className="h-3 w-3 mr-1" />
                    Rain-proof
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {rainInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        {!rainInfo.rainProof && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span>{' '}
              Carry an umbrella or check the forecast before heading out. Early mornings are usually clear.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
