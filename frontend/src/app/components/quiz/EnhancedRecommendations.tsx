import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnhancedRecommendations } from "@/hooks/usePerformanceData";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

// Enhanced Recommendations Component
export function EnhancedRecommendationsSection({ userId }: { userId?: string }) {
    const { data: recommendations, isLoading } = useEnhancedRecommendations(userId);
  
    if (isLoading || !recommendations?.recommendations?.length) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="space-y-6"
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span>Goal-Aware Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h6 className="font-medium text-white">{rec.title}</h6>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={
                          rec.priority >= 80 ? 'text-red-400 border-red-400' :
                          rec.priority >= 60 ? 'text-orange-400 border-orange-400' :
                          'text-blue-400 border-blue-400'
                        }
                      >
                        {rec.priority >= 80 ? 'High Priority' : 
                         rec.priority >= 60 ? 'Medium Priority' : 'Low Priority'}
                      </Badge>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {rec.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{rec.reason}</p>
                  
                  {/* Goal Context */}
                  {rec.goalContext && (
                    <div className="bg-gray-600/30 p-3 rounded text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="text-gray-400">Target:</span>
                          <span className="text-white ml-1">{rec.goalContext.targetScore}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Progress:</span>
                          <span className="text-white ml-1">{rec.goalContext.currentProgress}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Gap:</span>
                          <span className="text-white ml-1">{rec.goalContext.scoreGap}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Weak Areas:</span>
                          <span className="text-white ml-1">{rec.goalContext.weakAreasCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
  
                  {/* Factors */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.factors.slice(0, 4).map((factor, factorIndex) => (
                      <Badge key={factorIndex} variant="secondary" className="text-xs">
                        {factor.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  