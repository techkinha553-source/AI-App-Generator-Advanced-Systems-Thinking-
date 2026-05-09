import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"] as string | undefined;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Invalid authorization format"
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token missing"
      });
    }

    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token"
    });
  }
}