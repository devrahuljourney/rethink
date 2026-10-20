import supabase from "../config/supabase";
import { Request, Response, NextFunction } from "express";
import { User } from "@supabase/supabase-js";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export async function userAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Cookie for web clients, Authorization header for the mobile app
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = req.cookies?.access_token || bearerToken;

    if (!token) {
        return res.status(401).json({ message: 'You are not authenticated! Please log in.' });
    }

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ message: 'You are not authenticated! Please log in.' });
        }

        req.user = data.user;
        next();
    } catch (err) {
        console.error('Error in userAuthMiddleware:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}