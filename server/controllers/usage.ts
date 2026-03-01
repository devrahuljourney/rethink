import { Response } from "express";
import supabase from "../config/supabase";
import { User } from "@supabase/supabase-js";
import { DailyUsageSync } from "../types/usage";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export const syncUsage = async (req: any, res: Response) => {
    try {
        const user = req.user as User;
        const body = req.body as DailyUsageSync;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { date, totalUsageMs, appBreakdown, categorySummaries, insightData } = body;

        console.log(`UsageController: Syncing data for user ${user.id} on date ${date}`);
        console.log(`UsageController: Total usage: ${totalUsageMs}ms, Apps: ${appBreakdown.length}`);

        // 1. Store Daily Summary
        const { data: summaryData, error: summaryError } = await supabase
            .from('daily_usage_summaries')
            .upsert({
                user_id: user.id,
                date: date,
                total_usage_ms: totalUsageMs,
                category_summaries: categorySummaries,
                insight_data: insightData
            }, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (summaryError) {
            console.error('UsageController: Error storing summary:', summaryError);
            return res.status(400).json({ message: summaryError.message });
        }

        console.log(`UsageController: Summary stored with ID ${summaryData.id}`);

        // 2. Store App Breakdown
        const appUsageData = appBreakdown.map(app => ({
            summary_id: summaryData.id,
            user_id: user.id,
            date: date,
            app_name: app.name,
            package_name: app.package,
            usage_ms: app.usageMs,
            launches: app.launches,
            category: app.category
        }));

        // Delete existing details for this summary to avoid duplicates on retry
        const { error: deleteError } = await supabase
            .from('app_usage_details')
            .delete()
            .eq('summary_id', summaryData.id);

        if (deleteError) {
            console.warn('UsageController: Warning during cleanup:', deleteError);
        }

        const { error: detailError } = await supabase
            .from('app_usage_details')
            .insert(appUsageData);

        if (detailError) {
            console.error('UsageController: Error storing details:', detailError);
            return res.status(400).json({ message: detailError.message });
        }

        console.log(`UsageController: Successfully stored ${appUsageData.length} app details`);

        return res.status(200).json({
            success: true,
            message: "Usage data synced successfully",
        });

    } catch (error) {
        console.error('UsageController: Internal error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
