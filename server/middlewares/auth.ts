import supabase from "@config/supabase";
import { Request, Response, NextFunction } from "express";

export async function userAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies) {
        return res.status(401).json({ message: 'No cookies found in request' });
    }

    const { access_token: token } = req.cookies;

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