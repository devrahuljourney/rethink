import { Request, Response } from "express";
import { USER_SIGNUP_DATA } from "@app-types/auth";
import supabase from "@config/supabase";
import { CookieOptions } from "express";


export const userSignup = async (req: Request, res: Response) => {
  try {
    const body = req.body as USER_SIGNUP_DATA;
    const { email, password, name, mobile_number, confirm_password } = body;

    if (!email || !password || !name || !mobile_number || !confirm_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data:{
          name,
          mobile_number,
          }
      }
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: data.user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const userLogin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({ message: error?.message || "Invalid credentials" });
    }

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: data.session.expires_in * 1000,
      path: "/",
    };

    res.cookie("access_token", data.session.access_token, cookieOptions);

    return res.status(200).json({
      message: "User logged in successfully",
      user: data.user,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
