import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isMongoConnected } from '../config/db';
import { User } from '../models/User';
import { MockDB } from '../services/db.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'super-admin' | 'event-coordinator' | 'volunteer' | 'student';
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'campushub_super_jwt_secret_key_2026_premium_saas';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      let userProfile = null;
      
      if (isMongoConnected()) {
        const dbUser = await User.findById(decoded.id).select('-password');
        if (dbUser) {
          userProfile = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name
          };
        }
      } else {
        const mockUser = MockDB.findUserById(decoded.id);
        if (mockUser) {
          userProfile = {
            id: mockUser._id,
            email: mockUser.email,
            role: mockUser.role,
            name: mockUser.name
          };
        }
      }

      if (!userProfile) {
        return res.status(401).json({ success: false, message: 'User matching token not found' });
      }

      req.user = userProfile;
      next();
    } catch (error) {
      console.error('JWT Authorization error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user?.role || 'anonymous'}' is not authorized to access this resource` 
      });
    }
    next();
  };
};
