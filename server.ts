import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

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

app.post('/api/v1/match', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(500).json({ 
        error: 'Gemini API Key is not configured. Please set a valid GEMINI_API_KEY in the AI Studio Secrets panel.' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Extract tags using Gemini
    const extractResponse = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `不動産検索のためのユーザー入力から、ライフスタイルタグと希望条件を抽出してください。'tags'という文字列の配列を持つJSONオブジェクトを返してください。タグは日本語で、簡潔な単語（例：カフェ、リモートワーク、静か）にしてください。ユーザー入力: "${query}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '抽出されたライフスタイルと条件のタグリスト（日本語）'
            }
          },
          required: ['tags']
        }
      }
    });

    const extractedData = JSON.parse(extractResponse.text || '{"tags": []}');
    const userTags = extractedData.tags;

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

    // 3. Generate recommendation reasons
    const results = await Promise.all(topProperties.map(async (prop) => {
      const reasonResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `ユーザーのライフスタイル希望: "${query}"
        以下の物件を推薦します: ${prop.title} (${prop.location})
        物件説明: ${prop.description}
        物件の特徴タグ: ${prop.tags.join(', ')}
        
        この物件がなぜユーザーのライフスタイルに最適なのかを説明する、魅力的で簡潔な文章（日本語で2〜3文程度）を作成してください。`,
      });
      return {
        ...prop,
        recommendationReason: reasonResponse.text
      };
    }));

    res.json({
      extractedTags: userTags,
      recommendations: results
    });

  } catch (error: any) {
    console.error('Error in /api/v1/match:', error);
    if (error.message?.includes('API key not valid') || error.status === 400) {
      return res.status(400).json({ error: 'Invalid Gemini API Key. Please check your AI Studio Secrets.' });
    }
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
