const PRIVATE_RANGES = [
  /^127\./,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isLanIP(ip) {
  const clean = ip.replace(/^::ffff:/, '');
  return PRIVATE_RANGES.some((re) => re.test(clean));
}

module.exports = function lanOnly(req, res, next) {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_LAN_CHECK === 'true') {
    return next();
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';

  if (isLanIP(ip)) return next();

  return res.status(403).json({
    error: 'Access denied: system only available on internal network',
  });
};
