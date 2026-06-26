'use client';

import { useState } from 'react';
import { analyzeReview, type AnalysisResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import NetworkBadge from '@/components/NetworkBadge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function AnalyzePage() {
  const networkStatus = useAppStore((s) => s.networkStatus);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeReview(text.trim());
      setResult(res);
    } catch {
      setError('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">🔍 评论分析</h1>
        <NetworkBadge status={networkStatus} />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴需要分析的评论文本..."
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base resize-none
          focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
      />
      <Button onClick={handleAnalyze} disabled={loading || !text.trim()} className="w-full mb-4">
        {loading ? '分析中...' : '分析评论'}
      </Button>

      {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

      {result && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-3xl ${result.isFake ? '' : ''}`}>
              {result.isFake ? '🔴' : '🟢'}
            </span>
            <div>
              <div className="font-bold text-lg">
                {result.isFake ? '疑似虚假评论' : '可能是真实评论'}
              </div>
              <div className="text-sm text-gray-400">
                置信度 {(result.confidence * 100).toFixed(0)}% · 来源{' '}
                {result.source === 'cloud' ? '云端ML' : '本地规则'}
              </div>
            </div>
          </div>

          {result.indicators.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 mb-2">
                命中规则 ({result.indicators.length})
              </summary>
              <div className="space-y-1 mt-2">
                {result.indicators.map((ind, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      {ind.type}
                    </span>
                    <span className="font-mono text-sm">{ind.word}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      权重 {ind.weight.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </Card>
      )}
    </div>
  );
}
