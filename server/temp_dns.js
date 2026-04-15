const dns = require('dns');
dns.setServers(['8.8.8.8']);
dns.resolveTxt('webapp.ncd05xl.mongodb.net', (a,txt) => {
  dns.resolveSrv('_mongodb._tcp.webapp.ncd05xl.mongodb.net', (b,srv) => {
    require('fs').writeFileSync('dns_result.json', JSON.stringify({txt, srv}));
  });
});
