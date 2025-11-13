exports.handler = async function(event, context) {
    console.log('函数被调用，请求方法:', event.httpMethod);
    
    // 只处理POST请求
    if (event.httpMethod !== 'POST') {
        console.log('收到非POST请求:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '只支持POST请求' })
        };
    }
    
    try {
        const { essay } = JSON.parse(event.body);
        console.log('收到作文，长度:', essay ? essay.length : 0);
        
        if (!essay) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '作文内容不能为空' })
            };
        }
        
        // 从环境变量获取API密钥
        const API_KEY = process.env.QIANFAN_API_KEY;
        const APP_ID = process.env.QIANFAN_APP_ID;
        
        console.log('API_KEY 存在:', !!API_KEY);
        console.log('APP_ID 存在:', !!APP_ID);
        
        if (!API_KEY || !APP_ID) {
            console.error('环境变量缺失:', { hasApiKey: !!API_KEY, hasAppId: !!APP_ID });
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: '服务器配置错误：请检查环境变量设置',
                    details: {
                        hasApiKey: !!API_KEY,
                        hasAppId: !!APP_ID
                    }
                })
            };
        }
        
        const systemPrompt = `You are a strict but fair online course assistant, grading a final essay on fake news identification. Please evaluate the student's essay strictly according to the following rubric.

**Grading Dimensions & Weights:**
1. Information Classification & Concept Application (20 points) - Assessing understanding of fake news typology
2. Verification Process & Skill Demonstration (30 points) - Assessing application of SIFT method  
3. Depth of Analysis & Critical Thinking (25 points) - Assessing multi-angle analysis of dissemination motives
4. Personal Reflection & Course Connection (15 points) - Assessing learning internalization and metacognition
5. Structure & Language Expression (10 points) - Assessing writing quality

**Detailed Grading Standards:**
- Excellent (A): 17-20/26-30/22-25/13-15/9-10 points
- Good (B): 14-16/22-25/18-21/11-12/8 points  
- Pass (C): 12-13/18-21/15-17/9-10/7 points
- Fail (F): 0-11/0-17/0-14/0-8/0-6 points

**Special Focus on SIFT Method Application:**
- Stop: Whether they mentioned pausing before judgment
- Investigate the Source: Whether they examined information source and background
- Find Better Coverage: Whether they compared multiple sources
- Trace Claims: Whether they verified specific claims and images

**Feedback Requirements:**
1. Provide individual scores for each dimension with brief justification
2. Identify 2-3 specific strengths with examples from the text
3. Provide 2-3 specific improvement suggestions with actionable advice
4. Calculate total score and provide overall evaluation
5. Maintain constructive and encouraging tone throughout

**Pass/Fail Determination:**
- If total score ≥ 60/100: Include "Congratulations on completing this course!" at the end
- If total score < 60/100: Clearly state they need to revise and resubmit, with specific guidance on how to improve

Please analyze the following student essay based on these criteria:`;

        const requestBody = {
            "model": "deepseek-v3",
            "messages": [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                     "content": `Please grade the following essay about fake news identification and verification using the SIFT method:\n\n${essay}`
                }
            ],
            "stream": false
        };

        console.log('准备调用千帆API...');
        
        const response = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY,
                'appid': APP_ID
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('千帆API响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('千帆API错误详情:', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            throw new Error(`千帆API错误: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('千帆API成功响应');
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        console.error('函数执行错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: `处理请求时出错: ${error.message}`,
                stack: error.stack
            })
        };
    }
};
