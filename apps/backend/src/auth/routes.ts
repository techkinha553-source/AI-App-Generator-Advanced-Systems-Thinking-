import { Router } from "express";
import {
  comparePassword,
  generateToken,
  hashPassword
} from "./auth";

const router = Router();

const users: any[] = [];

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required"
      });
    }

    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists"
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = {
      id: Date.now(),
      email,
      password: hashedPassword
    };

    users.push(user);

    const token = generateToken({
      id: user.id,
      email: user.email
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Signup failed"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const validPassword = await comparePassword(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
});

export default router;