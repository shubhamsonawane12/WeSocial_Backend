import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log("authHeader: ", authHeader);
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }  
    
    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.userId = decoded.userId;
    console.log("userId: ", req.userId);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default authMiddleware;
