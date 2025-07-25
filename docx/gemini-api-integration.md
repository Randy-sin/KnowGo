# Gemini API 集成文档

## API 基本信息

**API Key:** `[设置在环境变量 GEMINI_API_KEY 中]`

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

##串流回應
根據預設，模型只會在整個生成程序完成後傳回回覆。

如要提供更流暢的互動體驗，可以使用串流功能，在 GenerateContentResponse 例項產生時，逐漸接收這些例項。

JavaScript


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });

  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

await main();
