import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({
        error: "Unauthorized"
      });
  }

  try {
    jwt.verify(
      token,
      "SECRET_KEY"
    );

    next();
  } catch {
    return res
      .status(401)
      .json({
        error: "Invalid token"
      });
  }
}