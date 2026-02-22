import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());
const PORT = 3000;

// Dummy Database
const properties = [
  {
    id: 'p1',
    title: 'サニーリバーサイド・アパートメント',
    location: '東京都 目黒区 中目黒',
    rent: 150000,
    layout: '1LDK',
    tags: ['日当たり', '静か', 'リバーサイド', 'カフェ', 'リモートワーク', '読書'],
    description: '川沿いの静かな環境にあるアパート。日当たりが良く、リモートワークに最適です。周辺にはおしゃれなカフェが多数あります。',
    image: 'https://picsum.photos/seed/p1/800/600'
  },
  {
    id: 'p2',
    title: 'アーバンテック・ハブ・スタジオ',
    location: '東京都 渋谷区 渋谷',
    rent: 120000,
    layout: '1K',
    tags: ['利便性', 'ナイトライフ', 'テック', 'ジム', '駅近', 'アクティブ'],
    description: '都心へのアクセスが抜群なコンパクトなスタジオ。アクティブなプロフェッショナルに最適です。',
    image: 'https://picsum.photos/seed/p2/800/600'
  },
  {
    id: 'p3',
    title: 'コージー・サバーバン・リトリート',
    location: '東京都 武蔵野市 吉祥寺',
    rent: 110000,
    layout: '2DK',
    tags: ['公園', '自然', '静か', 'ファミリー', '読書', 'ベーカリー', 'ゆったり'],
    description: '大きな公園の近くにある広々としたアパート。週末のリラックスや読書に最適な、落ち着いた環境です。',
    image: 'https://picsum.photos/seed/p3/800/600'
  },
  {
    id: 'p4',
    title: 'クリエイティブ・ロフトスペース',
    location: '東京都 世田谷区 下北沢',
    rent: 140000,
    layout: '1LDK',
    tags: ['カルチャー', '音楽', 'ヴィンテージ', 'カフェ', 'クリエイティブ', 'アート'],
    description: '文化的な街にあるユニークなロフト。カフェやヴィンテージショップに囲まれ、クリエイティブな刺激に満ちています。',
    image: 'https://picsum.photos/seed/p4/800/600'
  }
];

// キーワード辞書（簡易的な自然言語解析の代わり）
const keywordMap: Record<string, string[]> = {
  'カフェ': ['カフェ', 'コーヒー', '喫茶店', 'お茶'],
  'リモートワーク': ['リモート', 'テレワーク', '在宅', '仕事', 'ワーク'],
  '静か': ['静か', '落ち着いた', '騒音', 'のんびり'],
  '日当たり': ['日当たり', '明るい', '太陽', '光'],
  '利便性': ['便利', 'スーパー', '買い物', 'アクセス'],
  '駅近': ['駅近', '駅チカ', '徒歩', '近い'],
  '公園': ['公園', '緑', '散歩', 'ピクニック'],
  '自然': ['自然', '川', '森', '木', 'リバーサイド'],
  '読書': ['読書', '本', '図書館'],
  '音楽': ['音楽', 'ライブ', 'レコード', 'バンド'],
  'クリエイティブ': ['クリエイティブ', 'デザイン', 'おしゃれ', 'カルチャー'],
  'アート': ['アート', '美術館', 'ギャラリー', '絵']
};

app.post('/api/v1/match', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // 1. Extract tags using rule-based matching (Mocking LLM)
    const userTags: string[] = [];
    for (const [tag, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        userTags.push(tag);
      }
    }

    // 何もマッチしなかった場合のフォールバック
    if (userTags.length === 0) {
      userTags.push('静か', '日当たり');
    }

    // 2. Score properties
    const scoredProperties = properties.map(prop => {
      let score = 0;
      const matchedTags: string[] = [];
      userTags.forEach((userTag: string) => {
        if (prop.tags.some(t => t.includes(userTag) || userTag.includes(t))) {
          score += 1;
          matchedTags.push(userTag);
        }
      });
      return { ...prop, score, matchedTags };
    }).sort((a, b) => b.score - a.score);

    const topProperties = scoredProperties.slice(0, 2);

    // 3. Generate recommendation reasons (Mocking LLM)
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
        recommendationReason: reasonText
      };
    });

    // 意図的な遅延を入れてAIの処理時間をシミュレート（UX向上のため）
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({
      extractedTags: userTags,
      recommendations: results
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
