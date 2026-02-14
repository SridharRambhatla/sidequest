'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip 
} from 'recharts';
import { 
  IndianRupee, 
  CheckCircle, 
  AlertCircle,
  Utensils,
  Palette,
  Car,
  Ticket,
  Gift
} from 'lucide-react';
import { BudgetBreakdown as BudgetBreakdownType, BudgetItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BudgetBreakdownProps {
  budget: BudgetBreakdownType;
  targetBudget?: { min: number; max: number };
  className?: string;
}

const COLORS = ['#4A90A4', '#7BA388', '#C4846C', '#E9B44C', '#8B7355'];

const typeIcons: Record<string, React.ElementType> = {
  experience: Ticket,
  meal: Utensils,
  transport: Car,
  activity: Palette,
  other: Gift,
};

export function BudgetBreakdown({ 
  budget, 
  targetBudget = { min: 200, max: 5000 },
  className 
}: BudgetBreakdownProps) {
  // Aggregate costs by type
  const aggregatedByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    budget.breakdown.forEach((item) => {
      const type = item.type || 'other';
      typeMap.set(type, (typeMap.get(type) || 0) + item.cost);
    });

    return Array.from(typeMap.entries()).map(([type, value], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: COLORS[index % COLORS.length],
    }));
  }, [budget.breakdown]);

  // Calculate budget percentage
  const budgetPercentage = useMemo(() => {
    const max = targetBudget.max;
    return Math.min((budget.total_estimate / max) * 100, 100);
  }, [budget.total_estimate, targetBudget.max]);

  const isWithinBudget = budget.within_budget;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Budget Breakdown
          </CardTitle>
          <Badge 
            variant={isWithinBudget ? 'default' : 'destructive'}
            className={cn(
              isWithinBudget 
                ? 'bg-secondary/20 text-secondary-foreground border border-secondary/30' 
                : ''
            )}
          >
            {isWithinBudget ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Within Budget
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Over Budget
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Donut chart */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregatedByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {aggregatedByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Total estimate */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-muted-foreground">Total Estimate</span>
                <span className="text-2xl font-bold">
                  ₹{budget.total_estimate.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                <span>₹{targetBudget.min.toLocaleString('en-IN')}</span>
                <span>₹{targetBudget.max.toLocaleString('en-IN')}</span>
              </div>
              <Progress 
                value={budgetPercentage} 
                className={cn(
                  'h-2',
                  !isWithinBudget && '[&>div]:bg-destructive'
                )}
              />
            </div>

            {/* Breakdown list */}
            <div className="space-y-2">
              {budget.breakdown.slice(0, 5).map((item, index) => {
                const Icon = typeIcons[item.type] || typeIcons.other;
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                      >
                        <Icon 
                          className="h-4 w-4"
                          style={{ color: COLORS[index % COLORS.length] }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.experience || item.type}
                        </p>
                        {item.booking_required && (
                          <p className="text-xs text-muted-foreground">
                            Book {item.booking_required}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-medium">
                      ₹{item.cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Deals */}
            {budget.deals && budget.deals.length > 0 && (
              <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
                <p className="text-sm font-medium text-secondary-foreground mb-1">
                  💡 Money-saving tip
                </p>
                <p className="text-sm text-muted-foreground">
                  {budget.deals[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
