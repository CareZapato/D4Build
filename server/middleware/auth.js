import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No autorizado',
        message: 'Token no proporcionado' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Por favor inicia sesión nuevamente' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'Autenticación fallida' 
    });
  }
};

export const requirePremium = (req, res, next) => {
  if (req.user.account_type !== 'Premium') {
    return res.status(403).json({ 
      error: 'Premium requerido',
      message: 'Esta funcionalidad requiere una cuenta Premium' 
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      error: 'Acceso denegado',
      message: 'Solo administradores pueden acceder a este recurso' 
    });
  }
  next();
};
