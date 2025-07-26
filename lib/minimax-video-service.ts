export interface VideoGenerationRequest {
  prompt: string
  userLevel?: 'beginner' | 'intermediate' | 'expert'
  duration?: number
  resolution?: '720P' | '1080P'
}

export interface VideoTaskResponse {
  taskId: string
  status: 'created'
}

export interface VideoStatusResponse {
  taskId: string
  status: 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail'
  fileId?: string
  videoWidth?: number
  videoHeight?: number
}

export interface VideoDownloadResponse {
  fileId: string
  downloadUrl: string
  filename: string
  bytes: number
}

// MiniMax API Key (from documentation)
const MINIMAX_API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLlhrzmmJ_mnJciLCJVc2VyTmFtZSI6IuWGvOaYn-aclyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTExOTg1NjgwODM4MzA0NjkxIiwiUGhvbmUiOiIxMzc2MDkwMTMxOCIsIkdyb3VwSUQiOiIxOTExOTg1NjgwODM0MTEwMzg3IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMDctMjYgMTU6NDE6NTEiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.jSdFhLJR2JFy0H0PdjiJPXr28DnZf6jpsQPF5MS0wbdGzZcyii1OSeAvNCls9CecbShP3P-FAjL32T853q2ilvFhgVOIIWrNdvxW_QS-tYqtswoFTJzWqBZyIvwgRTAjRmyndYeal1tqnP2f2Gxj8uESRGLl5P0ncHNV38UVNRrwU9zMu1Xjd4daT19HeO7IPLsn5Ko_q0olaxIaT4NcQWE11Jm8eijnBD2KyODNn95CLQZdelcXHwfhRDOkE0FHzhQfJq5sLtEgXEwy3HZSEjJk7PmHjg0kJVJWKZP_bKVP9Tz5Vjebv-V7wVpgu6_jIAKIDu9YMexJPX6KEi2YNA";

const MINIMAX_BASE_URL = "https://api.minimaxi.com/v1";
const MODEL = "MiniMax-Hailuo-02";

/**
 * 第一步：创建视频生成任务
 * @param request 视频生成请求参数
 * @returns 任务ID和状态
 */
export async function createVideoGenerationTask(request: VideoGenerationRequest): Promise<VideoTaskResponse> {
  const url = `${MINIMAX_BASE_URL}/video_generation`;
  
  const payload = {
    prompt: request.prompt,
    model: MODEL,
    duration: request.duration || 6,
    resolution: request.resolution || "1080P"
  };
  
  const headers = {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${result.base_resp?.status_msg}`);
    }

    if (!result.task_id) {
      throw new Error('No task ID returned from MiniMax API');
    }

    return {
      taskId: result.task_id,
      status: 'created'
    };
  } catch (error) {
    console.error('Error creating video generation task:', error);
    throw new Error(`视频生成任务创建失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 第二步：查询视频生成任务状态
 * @param taskId 任务ID
 * @returns 任务状态信息
 */
export async function queryVideoGenerationStatus(taskId: string): Promise<VideoStatusResponse> {
  const url = `${MINIMAX_BASE_URL}/query/video_generation?task_id=${taskId}`;
  
  const headers = {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`
  };

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${result.base_resp?.status_msg}`);
    }

    return {
      taskId: result.task_id,
      status: result.status,
      fileId: result.file_id || undefined,
      videoWidth: result.video_width || undefined,
      videoHeight: result.video_height || undefined
    };
  } catch (error) {
    console.error('Error querying video generation status:', error);
    throw new Error(`视频任务状态查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 第三步：获取视频下载信息
 * @param fileId 文件ID
 * @returns 下载链接和文件信息
 */
export async function getVideoDownloadInfo(fileId: string): Promise<VideoDownloadResponse> {
  const url = `${MINIMAX_BASE_URL}/files/retrieve?file_id=${fileId}`;
  
  const headers = {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`
  };

  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax API error: ${result.base_resp?.status_msg}`);
    }

    if (!result.file?.download_url) {
      throw new Error('No download URL returned from MiniMax API');
    }

    return {
      fileId: result.file.file_id.toString(),
      downloadUrl: result.file.download_url,
      filename: result.file.filename || 'video.mp4',
      bytes: result.file.bytes || 0
    };
  } catch (error) {
    console.error('Error getting video download info:', error);
    throw new Error(`视频下载信息获取失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 完整的视频生成流程（异步轮询）
 * @param request 视频生成请求
 * @param onProgress 进度回调函数
 * @param maxAttempts 最大轮询次数
 * @param pollInterval 轮询间隔（毫秒）
 * @returns 最终的下载信息
 */
export async function generateVideoComplete(
  request: VideoGenerationRequest,
  onProgress?: (status: string, progress?: number) => void,
  maxAttempts: number = 60,
  pollInterval: number = 10000
): Promise<VideoDownloadResponse> {
  try {
    // 第一步：创建任务
    onProgress?.('creating', 0);
    const taskResponse = await createVideoGenerationTask(request);
    
    onProgress?.('polling', 5);
    
    // 第二步：轮询状态
    let attempts = 0;
    while (attempts < maxAttempts) {
      const statusResponse = await queryVideoGenerationStatus(taskResponse.taskId);
      
      const progress = Math.min(10 + (attempts / maxAttempts) * 80, 90);
      
      switch (statusResponse.status) {
        case 'Preparing':
          onProgress?.('preparing', progress);
          break;
        case 'Queueing':
          onProgress?.('queueing', progress);
          break;
        case 'Processing':
          onProgress?.('processing', progress);
          break;
        case 'Success':
          if (statusResponse.fileId) {
            onProgress?.('downloading', 95);
            const downloadInfo = await getVideoDownloadInfo(statusResponse.fileId);
            onProgress?.('completed', 100);
            return downloadInfo;
          }
          throw new Error('Video generation succeeded but no file ID returned');
        case 'Fail':
          throw new Error('Video generation failed');
        default:
          throw new Error(`Unknown status: ${statusResponse.status}`);
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
    
    throw new Error('Video generation timed out');
  } catch (error) {
    console.error('Complete video generation failed:', error);
    throw error;
  }
} 