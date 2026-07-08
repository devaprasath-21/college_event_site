import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
      return res.status(400).json({ message: 'Username, email, and new password are required' });
    }

    // Find the user by both username and email to ensure identity verification
    const user = await User.findOne({ 
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this username and email combination' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    
    // Also update plaintext password for admin reference if we are keeping track of it
    user.plaintextPassword = newPassword;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};
