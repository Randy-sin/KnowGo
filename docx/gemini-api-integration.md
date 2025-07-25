# Gemini API 集成文档

## API 基本信息

**API Key:** `AIzaSyBxZ2fsjm-laE__4ELPZDbRLzzbTPY7ARU`

## 调用示例

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: GEMINI_API_KEY' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'