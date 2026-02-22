import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';

type Property = {
  id: string;
  title: string;
  location: string;
  rent: number;
  layout: string;
  tags: string[];
  description: string;
  image: string;
  source: 'manual' | 'seed' | 'ielove-cloud' | 'reinfolib';
  externalId?: string;
  syncedAt?: string;
};

type CreatePropertyRequest = {
  title: string;
  location: string;
  rent: number;
  layout: string;
  tags?: string[];
  description?: string;
  image?: string;
};

type ExternalProperty = {
  externalId: string;
  title: string;
  location: string;
  rent: number;
  layout: string;
  tags: string[];
  description: string;
  image: string;
};

const app = express();
app.use(express.json());
const PORT = 3000;

const ieloveCloudConfig = {
  apiBaseUrl: process.env.IELOVE_CLOUD_API_BASE_URL || '',
  apiKey: process.env.IELOVE_CLOUD_API_KEY || '',
  companyId: process.env.IELOVE_CLOUD_COMPANY_ID || '',
};

const reinfolibConfig = {
  apiBaseUrl: process.env.REINFOLIB_API_BASE_URL || 'https://www.reinfolib.mlit.go.jp/api/request/',
  apiKey: process.env.REINFOLIB_API_KEY || '',
};

const hasIeloveCloudCredentials =
  Boolean(ieloveCloudConfig.apiBaseUrl) &&
  Boolean(ieloveCloudConfig.apiKey) &&
  Boolean(ieloveCloudConfig.companyId);

const hasReinfolibCredentials = Boolean(reinfolibConfig.apiKey);

const seedProperties: Property[] = [
  {
    id: 'p1',
    title: 'サニーリバーサイド・アパートメント',
    location: '東京都 目黒区 中目黒',
    rent: 150000,
    layout: '1LDK',
    tags: ['日当たり', '静か', 'リバーサイド', 'カフェ', 'リモートワーク', '読書'],
    description: '川沿いの静かな環境にあるアパート。日当たりが良く、リモートワークに最適です。周辺にはおしゃれなカフェが多数あります。',
    image: 'https://picsum.photos/seed/p1/800/600',
    source: 'seed',
  },
  {
    id: 'p2',
    title: 'アーバンテック・ハブ・スタジオ',
    location: '東京都 渋谷区 渋谷',
    rent: 120000,
    layout: '1K',
    tags: ['利便性', 'ナイトライフ', 'テック', 'ジム', '駅近', 'アクティブ'],
    description: '都心へのアクセスが抜群なコンパクトなスタジオ。アクティブなプロフェッショナルに最適です。',
    image: 'https://picsum.photos/seed/p2/800/600',
    source: 'seed',
  },
  {
    id: 'p3',
    title: 'コージー・サバーバン・リトリート',
    location: '東京都 武蔵野市 吉祥寺',
    rent: 110000,
    layout: '2DK',
    tags: ['公園', '自然', '静か', 'ファミリー', '読書', 'ベーカリー', 'ゆったり'],
    description: '大きな公園の近くにある広々としたアパート。週末のリラックスや読書に最適な、落ち着いた環境です。',
    image: 'https://picsum.photos/seed/p3/800/600',
    source: 'seed',
  },
  {
    id: 'p4',
    title: 'クリエイティブ・ロフトスペース',
    location: '東京都 世田谷区 下北沢',
    rent: 140000,
    layout: '1LDK',
    tags: ['カルチャー', '音楽', 'ヴィンテージ', 'カフェ', 'クリエイティブ', 'アート'],
    description: '文化的な街にあるユニークなロフト。カフェやヴィンテージショップに囲まれ、クリエイティブな刺激に満ちています。',
    image: 'https://picsum.photos/seed/p4/800/600',
    source: 'seed',
  },
];

const manualProperties: Property[] = [];
const syncedProperties: Property[] = [];

const keywordMap: Record<string, string[]> = {
  カフェ: ['カフェ', 'コーヒー', '喫茶店', 'お茶'],
  リモートワーク: ['リモート', 'テレワーク', '在宅', '仕事', 'ワーク'],
  静か: ['静か', '落ち着いた', '騒音', 'のんびり'],
  日当たり: ['日当たり', '明るい', '太陽', '光'],
  利便性: ['便利', 'スーパー', '買い物', 'アクセス'],
  駅近: ['駅近', '駅チカ', '徒歩', '近い'],
  公園: ['公園', '緑', '散歩', 'ピクニック'],
  自然: ['自然', '川', '森', '木', 'リバーサイド'],
  読書: ['読書', '本', '図書館'],
  音楽: ['音楽', 'ライブ', 'レコード', 'バンド'],
  クリエイティブ: ['クリエイティブ', 'デザイン', 'おしゃれ', 'カルチャー'],
  アート: ['アート', '美術館', 'ギャラリー', '絵'],
};

const getAllProperties = () => [...manualProperties, ...syncedProperties, ...seedProperties];

const normalizeExternal = (
  source: 'ielove-cloud' | 'reinfolib',
  item: ExternalProperty,
): Property => ({
  id: `${source}-${item.externalId}`,
  source,
  externalId: item.externalId,
  title: item.title,
  location: item.location,
  rent: item.rent,
  layout: item.layout,
  tags: item.tags,
  description: item.description,
  image: item.image,
  syncedAt: new Date().toISOString(),
});

const replaceSyncedProperties = (source: 'ielove-cloud' | 'reinfolib', records: ExternalProperty[]) => {
  const filtered = syncedProperties.filter((p) => p.source !== source);
  const normalized = records.map((record) => normalizeExternal(source, record));
  syncedProperties.splice(0, syncedProperties.length, ...filtered, ...normalized);
  return normalized.length;
};

const fetchIeloveCloudProperties = async (): Promise<ExternalProperty[]> => {
  // 実運用時は、いえらぶCLOUDの物件一覧APIレスポンス仕様に合わせて変換してください。
  const endpoint = `${ieloveCloudConfig.apiBaseUrl}/properties?company_id=${encodeURIComponent(ieloveCloudConfig.companyId)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${ieloveCloudConfig.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`いえらぶCLOUD API エラー: ${response.status}`);
  }

  const data = (await response.json()) as { properties?: ExternalProperty[] };
  return data.properties ?? [];
};

const fetchReinfolibProperties = async (): Promise<ExternalProperty[]> => {
  // API申請通過後に、正式エンドポイント・必須パラメータに合わせて実装を差し替えられるよう分離。
  const response = await fetch(reinfolibConfig.apiBaseUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': reinfolibConfig.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`REINFOLIB API エラー: ${response.status}`);
  }

  const data = (await response.json()) as { properties?: ExternalProperty[] };
  return data.properties ?? [];
};

app.get('/api/v1/properties', (_req, res) => {
  res.json({
    total: getAllProperties().length,
    manualCount: manualProperties.length,
    syncedCount: syncedProperties.length,
    seedCount: seedProperties.length,
    properties: getAllProperties(),
  });
});

app.post('/api/v1/properties', (req, res) => {
  const body = req.body as CreatePropertyRequest;

  if (!body.title || !body.location || !body.layout || typeof body.rent !== 'number') {
    return res.status(400).json({ error: 'title, location, layout, rent(number) は必須です' });
  }

  const newProperty: Property = {
    id: `manual-${Date.now()}`,
    source: 'manual',
    title: body.title,
    location: body.location,
    rent: body.rent,
    layout: body.layout,
    tags: body.tags ?? [],
    description: body.description ?? '',
    image: body.image ?? 'https://picsum.photos/seed/manual-property/800/600',
    syncedAt: new Date().toISOString(),
  };

  manualProperties.unshift(newProperty);
  return res.status(201).json(newProperty);
});

app.get('/api/v1/integrations/status', (_req, res) => {
  res.json({
    ieloveCloud: {
      configured: hasIeloveCloudCredentials,
      apiBaseUrl: ieloveCloudConfig.apiBaseUrl || null,
      companyId: ieloveCloudConfig.companyId || null,
    },
    reinfolib: {
      configured: hasReinfolibCredentials,
      apiBaseUrl: reinfolibConfig.apiBaseUrl,
      requestPage: 'https://www.reinfolib.mlit.go.jp/api/request/',
    },
  });
});

app.post('/api/v1/integrations/ielove-cloud/sync', async (_req, res) => {
  if (!hasIeloveCloudCredentials) {
    return res.status(400).json({
      error: 'いえらぶCLOUDの接続情報が不足しています。IELOVE_CLOUD_API_BASE_URL, IELOVE_CLOUD_API_KEY, IELOVE_CLOUD_COMPANY_ID を設定してください。',
    });
  }

  try {
    const records = await fetchIeloveCloudProperties();
    const importedCount = replaceSyncedProperties('ielove-cloud', records);
    return res.json({ source: 'ielove-cloud', importedCount });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'いえらぶCLOUD連携に失敗しました。' });
  }
});

app.post('/api/v1/integrations/reinfolib/sync', async (_req, res) => {
  if (!hasReinfolibCredentials) {
    return res.status(400).json({
      error: 'REINFOLIB_API_KEY が未設定です。申請承認後に環境変数を設定してください。',
    });
  }

  try {
    const records = await fetchReinfolibProperties();
    const importedCount = replaceSyncedProperties('reinfolib', records);
    return res.json({ source: 'reinfolib', importedCount });
  } catch (error: any) {
    return res.status(502).json({ error: error.message || 'REINFOLIB連携に失敗しました。' });
  }
});

app.post('/api/v1/match', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const userTags: string[] = [];
    for (const [tag, keywords] of Object.entries(keywordMap)) {
      if (keywords.some((kw) => query.includes(kw))) {
        userTags.push(tag);
      }
    }

    if (userTags.length === 0) {
      userTags.push('静か', '日当たり');
    }

    const scoredProperties = getAllProperties()
      .map((prop) => {
        let score = 0;
        const matchedTags: string[] = [];
        userTags.forEach((userTag: string) => {
          if (prop.tags.some((t) => t.includes(userTag) || userTag.includes(t))) {
            score += 1;
            matchedTags.push(userTag);
          }
        });
        return { ...prop, score, matchedTags };
      })
      .sort((a, b) => b.score - a.score);

    const topProperties = scoredProperties.slice(0, 2);

    const results = topProperties.map((prop) => {
      const matched = prop.matchedTags.join('や');
      let reasonText = '';

      if (matched) {
        reasonText = `ご希望の「${matched}」という条件にぴったりマッチする物件です。${prop.description} あなたの理想のライフスタイルを実現できる環境が整っています。`;
      } else {
        reasonText = `あなたの入力したライフスタイルから、こちらの物件をピックアップしました。${prop.description}`;
      }

      return {
        ...prop,
        recommendationReason: reasonText,
      };
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    res.json({
      extractedTags: userTags,
      recommendations: results,
    });
  } catch (error: any) {
    console.error('Error in /api/v1/match:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
