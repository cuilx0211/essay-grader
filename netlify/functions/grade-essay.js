exports.handler = async function(event, context) {
    // 只处理POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '只支持POST请求' })
        };
    }
    
    try {
        const { essay } = JSON.parse(event.body);
        
        if (!essay) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '作文内容不能为空' })
            };
        }
        
        // 从环境变量获取API密钥
        const API_KEY = process.env.QIANFAN_API_KEY;
        const APP_ID = process.env.QIANFAN_APP_ID;
        
        if (!API_KEY || !APP_ID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: '服务器配置错误：请检查环境变量设置' })
            };
        }
        
        const systemPrompt = `你是一位专业的语文教师，专门负责批改学生作文。请按照以下要求进行批改：

批改要求：
1. 首先给出总体评价（150-250字）
2. 从四个维度进行评分（每个维度满分25分，总分100分）：
   - 内容与结构：主题明确性、结构合理性、逻辑连贯性
   - 语言表达：词汇丰富性、句式多样性、表达准确性
   - 语法规范：语法正确性、标点规范性、文字准确性
   - 创意与深度：观点新颖性、思考深刻性、见解独特性

3. 针对每个维度给出2-3条具体改进建议
4. 最后给出3-5条整体提升建议

请用专业且鼓励的语气进行批改，既要指出问题也要肯定优点。请严格按照上述格式回复。`;

        const requestBody = {
            "model": "deepseek-v3",
            "messages": [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": `请批改以下作文：\n\n${essay}`
                }
            ],
            "stream": false
        };
        
        const response = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY,
                'appid': APP_ID
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('千帆API错误:', response.status, errorText);
            throw new Error(`千帆API错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        console.error('函数执行错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: `处理请求时出错: ${error.message}` 
            })
        };
    }
};
