import { Request, Response } from "express";
import { USER_SIGNUP_DATA } from "@app-types/auth";
import supabase from "@config/supabase";

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
