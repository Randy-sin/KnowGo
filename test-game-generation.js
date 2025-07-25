const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 加载环境变量
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.log('无法读取 .env.local 文件:', error.message);
  }
}

loadEnvLocal();

// 检查环境变量
if (!process.env.GEMINI_API_KEY) {
  console.log('请设置 GEMINI_API_KEY 环境变量');
  process.exit(1);
}

async function testGameGeneration() {
  console.log('🎮 开始测试游戏生成服务...\n');

  try {
    // 测试数据
    const testRequest = {
      topic: '抛物线',
      category: 'science',
      userLevel: 'intermediate',
      learningObjective: '通过互动游戏深度理解抛物线的核心概念'
    };

    console.log('📋 测试请求参数:');
    console.log(JSON.stringify(testRequest, null, 2));
    console.log('\n🚀 发送请求到 /api/generate-game...\n');

    // 发送请求到我们的API
    const response = await fetch('http://localhost:3000/api/generate-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ API响应成功!');
    console.log('🎮 游戏标题:', result.game?.title || '未知');
    console.log('📝 游戏说明:', result.game?.instructions || '未知');
    console.log('🎯 游戏类型:', result.game?.gameType || '未知');
    
    if (result.game?.html) {
      // 保存生成的HTML到文件
      const filename = `generated-game-${Date.now()}.html`;
      fs.writeFileSync(filename, result.game.html);
      console.log(`💾 游戏HTML已保存到: ${filename}`);
      console.log(`📏 HTML文件大小: ${(result.game.html.length / 1024).toFixed(2)} KB`);
    }

    console.log('\n🎉 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testGameGeneration();
}

module.exports = { testGameGeneration }; 