import os
import google.generativeai as genai

# GitHubのSecretから自動的に読み込まれるように設定
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    raise ValueError("APIキーが設定されていません。")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

# 実行テスト
response = model.generate_content("GitHub Actionsからのテストです。短い挨拶を返して。")
print(response.text)
