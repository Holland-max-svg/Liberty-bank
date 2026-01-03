const jwt = require("jsonwebtoken");

// Updated secret key for Liberty Trust Capital
const JWT_SECRET = "liberty_trust_secret_key"; // must match your token generation code

function authGuard(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) 
    return res.status(401).json({ success: false, message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) 
    return res.status(401).json({ success: false, message: "Token missing" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) 
      return res.status(401).json({ success: false, message: "Invalid token" });

    // Attach useful info to request
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.accountType = decoded.accountType;

    next();
  });
}

module.exports = authGuard;

