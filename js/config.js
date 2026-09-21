/* =============================================
   Al Handassa.dz — URL du serveur (API + fichiers)
   Un seul endroit à modifier. Chargé avant tous les autres scripts du site.
   - développement : front servi à part (frontend-server.js, Live Server, file://) → API sur localhost:5000
   - production / front servi par le backend (Railway, nginx, Vercel + rewrites) → même origine
   ============================================= */
var HDS_SERVER = (function () {
  var h = location.hostname;
  var devFront = (!h || h === 'localhost' || h === '127.0.0.1') && location.port !== '5000';
  return devFront ? 'http://localhost:5000' : location.origin;
})();
