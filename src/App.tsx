import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Home, MapPin, Tag, Sparkles, Database, Server, Code, Loader2, RefreshCw, Plus } from 'lucide-react';

type Property = {
  id: string;
  title: string;
  location: string;
  rent: number;
  layout: string;
  tags: string[];
  description: string;
  image: string;
  score: number;
  matchedTags: string[];
  recommendationReason: string;
};

type MatchResponse = {
  extractedTags: string[];
  recommendations: Property[];
};

type IntegrationStatus = {
  ieloveCloud: { configured: boolean; apiBaseUrl: string | null; companyId: string | null };
  reinfolib: { configured: boolean; apiBaseUrl: string; requestPage: string };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'demo' | 'architecture' | 'schema' | 'api'>('demo');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Home size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Lifestyle Estate AI</h1>
          </div>
          <nav className="flex gap-1">
            <TabButton active={activeTab === 'demo'} onClick={() => setActiveTab('demo')} icon={<Sparkles size={16} />}>Demo</TabButton>
            <TabButton active={activeTab === 'architecture'} onClick={() => setActiveTab('architecture')} icon={<Server size={16} />}>Architecture</TabButton>
            <TabButton active={activeTab === 'schema'} onClick={() => setActiveTab('schema')} icon={<Database size={16} />}>DB Schema</TabButton>
            <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} icon={<Code size={16} />}>API Design</TabButton>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'demo' && <DemoTab key="demo" />}
          {activeTab === 'architecture' && <ArchitectureTab key="architecture" />}
          {activeTab === 'schema' && <SchemaTab key="schema" />}
          {activeTab === 'api' && <ApiTab key="api" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function DemoTab() {
  const [query, setQuery] = useState('休日はカフェで読書したい。完全リモートワークなので日当たりと静かさを重視する');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
      setResult(data);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-semibold tracking-tight">Find a home that fits your life.</h2>
        <p className="text-stone-500 text-lg">
          条件ではなく、あなたの「理想の過ごし方」を教えてください。AIが最適な物件と街を提案します。
        </p>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-2 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：休日はカフェで読書したい。完全リモートワークなので..."
            className="w-full pl-12 pr-4 py-4 bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          AIで探す
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-medium"
        >
          {error}
        </motion.div>
      )}

      <PropertyManagementPanel />

      {result && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 pt-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-stone-500">抽出された価値観タグ:</span>
            {result.extractedTags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">
                #{tag}
              </span>
            ))}
          </div>

      <div className="space-y-6">
            {result.recommendations.map((prop) => (
              <div key={prop.id} className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm flex flex-col md:flex-row">
                <div className="md:w-2/5 relative">
                  <img src={prop.image} alt={prop.title} className="w-full h-64 md:h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 flex items-center gap-1">
                    <Sparkles size={14} />
                    Match Score: {prop.score}
                  </div>
                </div>
                <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
                    <MapPin size={16} />
                    {prop.location}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{prop.title}</h3>
                  <div className="flex gap-4 mb-6 text-sm font-medium">
                    <div className="bg-stone-100 px-3 py-1.5 rounded-lg">賃料: {(prop.rent / 10000).toFixed(1)}万円</div>
                    <div className="bg-stone-100 px-3 py-1.5 rounded-lg">間取り: {prop.layout}</div>
                  </div>
                  
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 text-emerald-800 font-medium mb-2">
                      <Sparkles size={18} />
                      AI レコメンド理由
                    </div>
                    <p className="text-stone-700 leading-relaxed text-sm">
                      {prop.recommendationReason}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {prop.tags.map(tag => (
                      <span key={tag} className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        prop.matchedTags.includes(tag) 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}


function PropertyManagementPanel() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', location: '', rent: 100000, layout: '', tags: '', description: '' });

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/v1/integrations/status');
      const data = await res.json();
      if (res.ok) setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const registerProperty = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rent: Number(form.rent),
          tags: form.tags.split(',').map((v) => v.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登録に失敗しました');
      setMessage(`手動登録完了: ${data.title}`);
      setForm({ title: '', location: '', rent: 100000, layout: '', tags: '', description: '' });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sync = async (source: 'ielove-cloud' | 'reinfolib') => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/integrations/${source}/sync`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '同期に失敗しました');
      setMessage(`${source} から ${data.importedCount} 件取り込みました`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
      loadStatus();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">物件登録・外部連携準備</h3>
        <button onClick={loadStatus} className="text-sm px-3 py-2 rounded-lg border border-stone-200 flex items-center gap-2">
          <RefreshCw size={14} /> 更新
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
          <p className="font-medium">いえらぶCLOUD</p>
          <p className="text-stone-500">状態: {status?.ieloveCloud.configured ? '設定済み' : '未設定'}</p>
          <button disabled={loading} onClick={() => sync('ielove-cloud')} className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60">同期実行</button>
        </div>
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
          <p className="font-medium">REINFOLIB (国交省API)</p>
          <p className="text-stone-500">状態: {status?.reinfolib.configured ? '設定済み' : '申請/キー待ち'}</p>
          <button disabled={loading} onClick={() => sync('reinfolib')} className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60">同期実行</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <input className="px-3 py-2 border border-stone-200 rounded-lg" placeholder="物件名" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="px-3 py-2 border border-stone-200 rounded-lg" placeholder="エリア" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className="px-3 py-2 border border-stone-200 rounded-lg" placeholder="賃料" type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: Number(e.target.value) })} />
        <input className="px-3 py-2 border border-stone-200 rounded-lg" placeholder="間取り" value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} />
      </div>
      <input className="w-full px-3 py-2 border border-stone-200 rounded-lg" placeholder="タグ(カンマ区切り)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      <textarea className="w-full px-3 py-2 border border-stone-200 rounded-lg" placeholder="説明" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button disabled={loading} onClick={registerProperty} className="px-4 py-2 rounded-lg bg-stone-900 text-white flex items-center gap-2 disabled:opacity-60">
        <Plus size={16} /> 手動登録
      </button>
      {message && <p className="text-sm text-stone-600">{message}</p>}
    </div>
  );
}

function ArchitectureTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm prose prose-stone max-w-none">
      <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6"><Server className="text-emerald-600" /> システムアーキテクチャの全体像</h2>
      
      <div className="space-y-6 text-stone-700">
        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <h3 className="text-lg font-medium text-stone-900 mb-3">1. クライアント (Frontend - React/Vite)</h3>
          <p>ユーザーが自然言語でライフスタイルや希望条件を入力し、バックエンドへ送信します。直感的なUIで検索体験を向上させます。</p>
        </div>

        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <h3 className="text-lg font-medium text-stone-900 mb-3">2. API Gateway / Backend (Node.js/Express)</h3>
          <p><code>POST /api/v1/match</code> エンドポイントでリクエストを受信し、LLM連携とデータベース検索のオーケストレーションを行います。</p>
        </div>

        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h3 className="text-lg font-medium text-emerald-900 mb-3 flex items-center gap-2"><Sparkles size={20}/> 3. ライフスタイル解析 (Rule-based Matching)</h3>
          <p className="text-emerald-800">受信したテキストをローカルのキーワード辞書と照合します。外部API（LLM）は使用せず、テキストから「価値観タグ（例: 静か, カフェ, リモートワーク）」をルールベースで抽出します。</p>
        </div>

        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <h3 className="text-lg font-medium text-stone-900 mb-3">4. マッチング・エンジン (Scoring)</h3>
          <p>抽出されたタグをもとに、物件データベースを検索します。物件の持つタグとユーザーの抽出タグの重複度合いによるスコアリングを行っています。</p>
        </div>

        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h3 className="text-lg font-medium text-emerald-900 mb-3 flex items-center gap-2"><Sparkles size={20}/> 5. レコメンド理由の生成 (Template-based)</h3>
          <p className="text-emerald-800">スコア上位の物件データとマッチしたタグをもとに、「なぜこの物件がおすすめなのか」を説明するテキストをテンプレートから動的に生成します（外部AI APIは不使用）。</p>
        </div>

        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <h3 className="text-lg font-medium text-stone-900 mb-3">6. レスポンス返却</h3>
          <p>抽出されたタグ、おすすめ物件のリスト、および生成されたレコメンド理由をJSON形式でクライアントに返却し、UIに表示します。</p>
        </div>
      </div>
    </motion.div>
  );
}

function SchemaTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
      <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6"><Database className="text-emerald-600" /> データベースのテーブル設計（スキーマ案）</h2>
      <p className="text-stone-600 mb-8">本番環境を想定したRDB（PostgreSQL等）とベクトルDBのハイブリッド構成案です。</p>

      <div className="grid md:grid-cols-2 gap-6">
        <SchemaCard title="Users (顧客情報)">
          <li><code className="text-emerald-600">id</code> (UUID, PK)</li>
          <li><code className="text-stone-800">name</code> (String)</li>
          <li><code className="text-stone-800">email</code> (String, Unique)</li>
          <li><code className="text-stone-800">lifestyle_raw_text</code> (Text) - 自由記述の履歴</li>
          <li><code className="text-stone-800">created_at</code> (Timestamp)</li>
        </SchemaCard>

        <SchemaCard title="Properties (物件情報)">
          <li><code className="text-emerald-600">id</code> (UUID, PK)</li>
          <li><code className="text-stone-800">title</code> (String) - 物件名やキャッチコピー</li>
          <li><code className="text-stone-800">description</code> (Text) - 物件の詳細説明</li>
          <li><code className="text-stone-800">location</code> (String) - 住所・エリア</li>
          <li><code className="text-stone-800">rent</code> (Integer) - 賃料</li>
          <li><code className="text-stone-800">layout</code> (String) - 間取り</li>
          <li><code className="text-purple-600 font-semibold">embedding</code> (Vector) - ベクトル検索用データ</li>
          <li><code className="text-stone-800">created_at</code> (Timestamp)</li>
        </SchemaCard>

        <SchemaCard title="Tags (特徴タグマスタ)">
          <li><code className="text-emerald-600">id</code> (UUID, PK)</li>
          <li><code className="text-stone-800">name</code> (String, Unique) - タグ名</li>
        </SchemaCard>

        <SchemaCard title="PropertyTags (中間テーブル)">
          <li><code className="text-emerald-600">property_id</code> (UUID, FK)</li>
          <li><code className="text-emerald-600">tag_id</code> (UUID, FK)</li>
        </SchemaCard>

        <SchemaCard title="UserPreferences (抽出条件)">
          <li><code className="text-emerald-600">user_id</code> (UUID, FK)</li>
          <li><code className="text-stone-800">extracted_tags</code> (JSONB) - LLM抽出タグ</li>
          <li><code className="text-stone-800">must_haves</code> (JSONB) - 絶対条件</li>
        </SchemaCard>
      </div>
    </motion.div>
  );
}

function SchemaCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden">
      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 font-medium text-stone-800">
        {title}
      </div>
      <ul className="p-4 space-y-2 text-sm text-stone-600 font-mono">
        {children}
      </ul>
    </div>
  );
}

function ApiTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
      <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6"><Code className="text-emerald-600" /> APIエンドポイント設計</h2>
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-mono font-bold text-sm">POST</span>
          <code className="text-lg font-mono text-stone-800">/api/v1/match</code>
        </div>
        <p className="text-stone-600">ユーザーの自由記述を受け取り、最適な物件とレコメンド理由を返却します。</p>
      </div>


      <div className="mb-8 space-y-3 text-stone-600">
        <p><code className="font-mono">GET /api/v1/properties</code> 手動登録 + 外部同期 + シード物件の一覧取得</p>
        <p><code className="font-mono">POST /api/v1/properties</code> 自社物件の手動登録</p>
        <p><code className="font-mono">GET /api/v1/integrations/status</code> 外部連携の設定状態確認</p>
        <p><code className="font-mono">POST /api/v1/integrations/ielove-cloud/sync</code> いえらぶCLOUD同期</p>
        <p><code className="font-mono">POST /api/v1/integrations/reinfolib/sync</code> REINFOLIB同期（APIキー承認後）</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">Request (JSON)</h3>
          <pre className="bg-stone-900 text-stone-300 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed">
{`{
  "query": "休日はカフェで読書したい。完全リモートワークなので日当たりと静かさを重視する",
  "filters": {
    "max_rent": 150000,
    "preferred_areas": ["Tokyo"]
  }
}`}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">Response (JSON)</h3>
          <pre className="bg-stone-900 text-stone-300 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed">
{`{
  "extractedTags": ["カフェ", "読書", "リモートワーク", "日当たり", "静か"],
  "recommendations": [
    {
      "id": "p1",
      "title": "サニーリバーサイド・アパートメント",
      "location": "東京都 目黒区 中目黒",
      "rent": 150000,
      "layout": "1LDK",
      "score": 3,
      "matchedTags": ["リモートワーク", "日当たり", "静か"],
      "tags": ["日当たり", "静か", "リバーサイド", "カフェ", "リモートワーク", "読書"],
      "description": "川沿いの静かな環境にあるアパート。日当たりが良く、リモートワークに最適です。周辺にはおしゃれなカフェが多数あります。",
      "image": "https://picsum.photos/seed/p1/800/600",
      "recommendationReason": "完全リモートワークに最適な、日当たりが良く静かな環境です。徒歩圏内に落ち着いたカフェが複数あり、休日の読書にもぴったりな物件です。"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
