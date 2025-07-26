视频生成（Video Generation）
该接口支持基于用户的文本描述、参考图片，进行视频生成。

视频生成采用异步方式，整体包含3个API：创建视频生成任务、查询视频生成任务状态文件管理。使用步骤如下：
1.使用创建视频生成任务接口，创建视频生成任务，并得到task_id；
2.使用查询视频生成任务状态接口，基于task_id查询视频生成任务状态；当状态为成功时，将获得对应的文件 ID（file_id）；
3.使用文件管理接口（File API）基于步骤2查询接口返回的file_id进行视频生成结果的查看和下载。
支持模型：MiniMax-Hailuo-02
新一代视频生成模型，更精准指令遵循，支持1080P超清视频；及10s视频生成。

下面是一个视频生成功能的完整使用示例，整个流程分为三步：
1.调用视频生成接口提交生成任务
2.轮询视频生成异步任务查询接口，获取任务状态和生成视频的文件ID
3.调用文件下载接口，通过文件ID下载生成的视频


import os
import time
import requests
import json

api_key = "请在此输入API Key"

prompt = "请在此输入生成视频的提示词文本内容"
model = "MiniMax-Hailuo-02" 
output_file_name = "output.mp4" #请在此输入生成视频的保存路径

def invoke_video_generation()->str:
    print("-----------------提交视频生成任务-----------------")
    url = "https://api.minimaxi.com/v1/video_generation"
    payload = json.dumps({
      "prompt": prompt,
      "model": model,
      "duration":6,
      "resolution":"1080P"
    })
    headers = {
      'authorization': 'Bearer ' + api_key,
      'content-type': 'application/json',
    }

    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)
    task_id = response.json()['task_id']
    print("视频生成任务提交成功，任务ID："+task_id)
    return task_id

def query_video_generation(task_id: str):
    url = "https://api.minimaxi.com/v1/query/video_generation?task_id="+task_id
    headers = {
      'authorization': 'Bearer ' + api_key
    }
    response = requests.request("GET", url, headers=headers)
    status = response.json()['status']
    if status == 'Preparing':
        print("...准备中...")
        return "", 'Preparing'
    elif status == 'Queueing':
        print("...队列中...")
        return "", 'Queueing'
    elif status == 'Processing':
        print("...生成中...")
        return "", 'Processing'
    elif status == 'Success':
        return response.json()['file_id'], "Finished"
    elif status == 'Fail':
        return "", "Fail"
    else:
        return "", "Unknown"


def fetch_video_result(file_id: str):
    print("---------------视频生成成功，下载中---------------")
    url = "https://api.minimaxi.com/v1/files/retrieve?file_id="+file_id
    headers = {
        'authorization': 'Bearer '+api_key,
    }

    response = requests.request("GET", url, headers=headers)
    print(response.text)

    download_url = response.json()['file']['download_url']
    print("视频下载链接：" + download_url)
    with open(output_file_name, 'wb') as f:
        f.write(requests.get(download_url).content)
    print("已下载在："+os.getcwd()+'/'+output_file_name)


if __name__ == '__main__':
    task_id = invoke_video_generation()
    print("-----------------已提交视频生成任务-----------------")
    while True:
        time.sleep(10)

        file_id, status = query_video_generation(task_id)
        if file_id != "":
            fetch_video_result(file_id)
            print("---------------生成成功---------------")
            break
        elif status == "Fail" or status == "Unknown":
            print("---------------生成失败---------------")
            break


api key：eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLlhrzmmJ_mnJciLCJVc2VyTmFtZSI6IuWGvOaYn-aclyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTExOTg1NjgwODM4MzA0NjkxIiwiUGhvbmUiOiIxMzc2MDkwMTMxOCIsIkdyb3VwSUQiOiIxOTExOTg1NjgwODM0MTEwMzg3IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMDctMjYgMTU6NDE6NTEiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.jSdFhLJR2JFy0H0PdjiJPXr28DnZf6jpsQPF5MS0wbdGzZcyii1OSeAvNCls9CecbShP3P-FAjL32T853q2ilvFhgVOIIWrNdvxW_QS-tYqtswoFTJzWqBZyIvwgRTAjRmyndYeal1tqnP2f2Gxj8uESRGLl5P0ncHNV38UVNRrwU9zMu1Xjd4daT19HeO7IPLsn5Ko_q0olaxIaT4NcQWE11Jm8eijnBD2KyODNn95CLQZdelcXHwfhRDOkE0FHzhQfJq5sLtEgXEwy3HZSEjJk7PmHjg0kJVJWKZP_bKVP9Tz5Vjebv-V7wVpgu6_jIAKIDu9YMexJPX6KEi2YNA