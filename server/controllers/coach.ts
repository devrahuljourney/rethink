import { Response } from "express";
import supabase from "../config/supabase";
import { User } from "@supabase/supabase-js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const getInsights = async (req: any, res: Response) => {
    try {
        const user = req.user as User;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "GEMINI_API_KEY is not configured on the server." });
        }

        // Fetch recent usage data (e.g. last 7 days) and map app_usage_details
        const { data: summaries, error } = await supabase
            .from('daily_usage_summaries')
            .select(`
                *,
                app_usage_details (
                    app_name,
                    usage_ms,
                    category
                )
            `)
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(7);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        // Format data for Gemini
        const usageContext = summaries?.map(s => {
            const topApps = s.app_usage_details
                ?.sort((a: any, b: any) => b.usage_ms - a.usage_ms)
                .slice(0, 5)
                .map((app: any) => ({
                    name: app.app_name,
                    minutes: Math.round(app.usage_ms / 60000),
                    category: app.category
                }));

            return {
                date: s.date,
                total_time_minutes: Math.round(s.total_usage_ms / 60000),
                categories: s.category_summaries || "Unknown",
                top_apps_used: topApps || []
            };
        }) || [];

        // Initialize Gemini model
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash-lite",
            apiKey: apiKey,
            maxOutputTokens: 1024,
        });

        // Prompt
        const promptText = `
        You are an AI Life & Screen Time Coach with a tough-but-empathetic personality. 
        Your goal is to help the user stop wasting time on their phone and start living in the real world.
        Analyze the following daily screen time usage data for the user over the last few days.
        Provide personalized, highly actionable insights. Use real-life analogies (e.g., "In the 3 hours you spent on Instagram, you could have read 50 pages of a book or cooked a healthy meal").
        
        Usage Data:
        ${JSON.stringify(usageContext, null, 2)}

        Provide the output in valid JSON format ONLY, without any markdown formatting wrappers like \`\`\`json.
        The JSON must match this structure exactly:
        {
          "greeting": "A short, punchy greeting (e.g. 'Hey there. Rough day on TikTok today.')",
          "realLifeImpact": "A 2-3 sentence tough-love comparison of what they could have done in the real world with the time they spent on their most used non-productive apps.",
          "missionOfTheDay": {
            "title": "A catchy title for their daily goal (e.g. 'Digital Detox Evening')",
            "description": "One highly actionable, specific task to complete today to reduce screen time.",
            "actionButtonText": "What the action button should say (e.g. 'Start Focus Mode', 'Set App Limits')",
            "actionType": "Enum of either 'FOCUS_MODE' or 'APP_LIMITS'"
          },
          "graphData": [
            { "label": "e.g., Social", "value": 120 },
            { "label": "e.g., Productivity", "value": 45 }
          ]
        }
        `;

        const response = await model.invoke(promptText);
        let content = response.content as string;

        // Clean up markdown if Gemini returned it despite instructions
        if (content.startsWith("\`\`\`json")) {
            content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
        } else if (content.startsWith("\`\`\`")) {
            content = content.replace(/\`\`\`/g, "").trim();
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse Gemini response:", content);
            return res.status(500).json({ message: "Failed to parse AI response" });
        }

        return res.status(200).json({
            success: true,
            data: parsedContent
        });

    } catch (error: any) {
        console.error('CoachController: Error getting insights:', error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
