import os
from google import genai # 新しいインポート方法

# GitHubのSecretから読み込み
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY が設定されていません。")

# クライアントの初期化 (最新の方式)
client = genai.Client(api_key=api_key)

try:
    # 実行テスト (モデル名は 'gemini-1.5-flash' でOKです)
    response = client.models.generate_content(
        model='gemini-1.5-flash', 
        contents="GitHub Actionsからのテストです。接続成功！と元気に返して。"
    )
    print(response.text)
    
except Exception as e:
    print(f"エラーが発生しました: {e}")
